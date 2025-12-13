import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pods, tournamentRoles, tournaments } from "@/lib/db/schema";
import { isRegistrationOpen } from "@/lib/db/queries";
import { Resend } from "resend";
import { eq, and } from "drizzle-orm";
import { createClient } from "@/lib/auth/server";

const resend = new Resend(process.env.RESEND_API_KEY);

interface RegistrationData {
  tournamentId: number;
  email: string;
  player1: string;
  player2: string;
  teamName: string;
  captchaToken: string;
}

// Verify Cloudflare Turnstile token
async function verifyTurnstileToken(token: string): Promise<boolean> {
  const response = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        secret: process.env.TURNSTILE_SECRET_KEY,
        response: token,
      }),
    }
  );

  const data = await response.json();
  return data.success === true;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body first to get tournamentId
    const body: RegistrationData = await request.json();
    const { tournamentId, email, player1, player2, teamName, captchaToken } =
      body;

    // Validate required fields
    if (!tournamentId || !email || !player1 || !player2 || !captchaToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Fetch tournament to check if auth is required
    const tournament = await db.query.tournaments.findFirst({
      where: eq(tournaments.id, tournamentId),
    });

    if (!tournament) {
      return NextResponse.json(
        { error: "Tournament not found" },
        { status: 404 }
      );
    }

    // Check authentication - only required if tournament.requireAuth is true
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (tournament.requireAuth && !user) {
      return NextResponse.json(
        { error: "Authentication required. Please sign in with Google." },
        { status: 401 }
      );
    }

    // Ensure email matches authenticated user (only for auth-required tournaments)
    if (tournament.requireAuth && user && email !== user.email) {
      return NextResponse.json(
        { error: "Email must match your authenticated account" },
        { status: 400 }
      );
    }

    // Verify CAPTCHA token
    const isCaptchaValid = await verifyTurnstileToken(captchaToken);
    if (!isCaptchaValid) {
      return NextResponse.json(
        { error: "CAPTCHA verification failed. Please try again." },
        { status: 400 }
      );
    }

    // Check if registration is still open for this tournament
    const registrationOpen = await isRegistrationOpen(tournamentId);
    if (!registrationOpen) {
      return NextResponse.json(
        { error: `Registration is closed. All ${tournament.maxPods} spots have been filled.` },
        { status: 400 }
      );
    }

    // Check if user already registered for this tournament
    // For auth-required tournaments: check by userId
    // For non-auth tournaments: check by email
    if (tournament.requireAuth && user) {
      const existingPod = await db
        .select()
        .from(pods)
        .where(and(eq(pods.userId, user.id), eq(pods.tournamentId, tournamentId)))
        .limit(1);

      if (existingPod.length > 0) {
        return NextResponse.json(
          {
            error:
              "You have already registered for this tournament. Each user can only register one pod per tournament.",
          },
          { status: 400 }
        );
      }
    } else if (!tournament.requireAuth) {
      // For non-auth tournaments, check by email
      const existingPod = await db
        .select()
        .from(pods)
        .where(and(eq(pods.email, email), eq(pods.tournamentId, tournamentId)))
        .limit(1);

      if (existingPod.length > 0) {
        return NextResponse.json(
          {
            error:
              "This email has already been registered for this tournament.",
          },
          { status: 400 }
        );
      }
    }

    // Create pod name (defaults to "Player1 & Player2")
    const podName = `${player1} & ${player2}`;
    const finalTeamName = teamName || podName;

    // Insert pod into database
    const [newPod] = await db
      .insert(pods)
      .values({
        tournamentId,
        userId: user?.id || null, // Only set if user is authenticated
        email,
        name: podName,
        player1,
        player2,
        teamName: teamName || null,
      })
      .returning();

    // Create participant role for user in this tournament (only for authenticated users)
    if (user) {
      await db.insert(tournamentRoles).values({
        userId: user.id,
        tournamentId,
        role: "participant",
      });
    }

    // Send confirmation email
    let emailSent = false;
    let emailError = null;

    try {
      // Format tournament date
      const tournamentDate = new Date(tournament.date);
      const formattedDate = tournamentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      const emailHtml = `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
            <div style="max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
              <!-- Header -->
              <div style="background-color: #727D73; color: #fff; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0;">
                <h1 style="margin: 0; font-size: 28px;">Registration Confirmed!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">${tournament.name}</p>
              </div>

              <!-- Content -->
              <div style="background-color: #fff; padding: 30px; border-radius: 0 0 8px 8px;">
                <p style="font-size: 16px; line-height: 1.6; margin-top: 0;">
                  Hi <strong>${player1}</strong>,
                </p>

                <p style="font-size: 16px; line-height: 1.6;">
                  You're all set! Your team has been successfully registered for ${tournament.name}.
                </p>

                <!-- Team Info Box -->
                <div style="background-color: #F0F0D7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #AAB99A;">
                  <h2 style="margin: 0 0 15px 0; font-size: 20px; color: #727D73;">Your Team</h2>
                  <p style="margin: 8px 0; font-size: 15px;"><strong>Team Name:</strong> ${finalTeamName}</p>
                  <p style="margin: 8px 0; font-size: 15px;"><strong>Captain:</strong> ${player1}</p>
                  <p style="margin: 8px 0; font-size: 15px;"><strong>Partner:</strong> ${player2}</p>
                  <p style="margin: 8px 0; font-size: 15px;"><strong>Email:</strong> ${email}</p>
                </div>

                <!-- Tournament Details -->
                <h2 style="font-size: 20px; color: #727D73; margin-top: 30px; margin-bottom: 15px;">Tournament Details</h2>
                <div style="font-size: 15px; line-height: 1.8;">
                  <p style="margin: 8px 0;"><strong>📅 Date:</strong> ${formattedDate}</p>
                  <p style="margin: 8px 0;">
                    <strong>📍 Location:</strong> ${tournament.location || 'TBD'}
                  </p>
                  ${tournament.prizeInfo ? `<p style="margin: 8px 0;"><strong>🏆 Prize:</strong> ${tournament.prizeInfo.split('\n')[0]}</p>` : ''}
                </div>

                ${tournament.poolPlayDescription || tournament.bracketPlayDescription ? `
                <!-- Tournament Format -->
                <h2 style="font-size: 20px; color: #727D73; margin-top: 30px; margin-bottom: 15px;">Tournament Format</h2>
                <div style="font-size: 15px; line-height: 1.8;">
                  ${tournament.poolPlayDescription ? `<p style="margin: 8px 0; white-space: pre-line;">${tournament.poolPlayDescription}</p>` : ''}
                  ${tournament.bracketPlayDescription ? `<p style="margin: 8px 0; white-space: pre-line;">${tournament.bracketPlayDescription}</p>` : ''}
                </div>
                ` : ''}

                <!-- What to Bring -->
                <h2 style="font-size: 20px; color: #727D73; margin-top: 30px; margin-bottom: 15px;">What to Bring</h2>
                <ul style="font-size: 15px; line-height: 1.8; padding-left: 20px;">
                  <li>Court shoes (no black soles)</li>
                  <li>Water bottle (there is a fountain on premises)</li>
                  <li>Your A-game!</li>
                </ul>

                <!-- Footer Message -->
                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd;">
                  <p style="font-size: 15px; line-height: 1.6; margin: 0;">
                    We'll send you more details closer to the tournament date. If you have any questions, feel free to reply to this email.
                  </p>
                  <p style="font-size: 15px; line-height: 1.6; margin-top: 15px;">
                    See you on the court! 🏐
                  </p>
                </div>
              </div>

              <!-- Footer -->
              <div style="text-align: center; padding: 20px; font-size: 13px; color: #666;">
                <p style="margin: 0;">
                  ${tournament.name}<br>
                  ${tournament.location || 'Location TBD'}
                </p>
              </div>
            </div>
          </body>
        </html>
      `;

      const result = await resend.emails.send({
        from: `${tournament.name} <tournament@hewwopwincess.com>`,
        to: [email],
        subject: `Registration Confirmed - ${tournament.name}`,
        html: emailHtml,
      });

      console.warn("Email sent successfully:", {
        id: result.data?.id || "unknown",
        email,
      });
      emailSent = true;
    } catch (error) {
      // Log detailed email error
      console.error("Failed to send confirmation email:", error);
      console.error("Email error details:", {
        message: error instanceof Error ? error.message : "Unknown error",
        email,
        resendApiKeyPresent: !!process.env.RESEND_API_KEY,
      });
      emailError = error instanceof Error ? error.message : "Unknown error";
      // Still continue since the pod was registered
    }

    // Return success response with email status
    return NextResponse.json(
      {
        success: true,
        pod: {
          id: newPod.id,
          name: podName,
          teamName: finalTeamName,
          player1,
          player2,
          email,
        },
        emailSent,
        emailError,
        message: emailSent
          ? "Registration successful! Check your email for confirmation."
          : "Registration successful! However, the confirmation email failed to send. Please check with the organizer.",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);

    // Check if it's a unique constraint violation (in case of race condition)
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return NextResponse.json(
        { error: "This email is already registered." },
        { status: 400 }
      );
    }

    // Generic error response
    return NextResponse.json(
      {
        error:
          "An unexpected error occurred during registration. Please try again.",
      },
      { status: 500 }
    );
  }
}
