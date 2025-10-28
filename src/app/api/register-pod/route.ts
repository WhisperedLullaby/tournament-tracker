import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pods } from "@/lib/db/schema";
import { isRegistrationOpen } from "@/lib/db/queries";
import { Resend } from "resend";
import { RegistrationConfirmationEmail } from "@/lib/emails/registration-confirmation";
import { eq } from "drizzle-orm";

const resend = new Resend(process.env.RESEND_API_KEY);

interface RegistrationData {
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
    // Parse request body
    const body: RegistrationData = await request.json();
    const { email, player1, player2, teamName, captchaToken } = body;

    // Validate required fields
    if (!email || !player1 || !player2 || !captchaToken) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /\S+@\S+\.\S+/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
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

    // Check if registration is still open
    const registrationOpen = await isRegistrationOpen();
    if (!registrationOpen) {
      return NextResponse.json(
        { error: "Registration is closed. All 9 spots have been filled." },
        { status: 400 }
      );
    }

    // Check for duplicate email
    const existingPod = await db
      .select()
      .from(pods)
      .where(eq(pods.email, email))
      .limit(1);

    if (existingPod.length > 0) {
      return NextResponse.json(
        {
          error:
            "This email is already registered. Each pod must use a unique email address.",
        },
        { status: 400 }
      );
    }

    // Create pod name (defaults to "Player1 & Player2")
    const podName = `${player1} & ${player2}`;
    const finalTeamName = teamName || podName;

    // Insert pod into database
    const [newPod] = await db
      .insert(pods)
      .values({
        email,
        name: podName,
        player1,
        player2,
        teamName: teamName || null,
      })
      .returning();

    // Send confirmation email
    try {
      await resend.emails.send({
        from: "Bonnie & Clyde Tournament <tournament@hewwopwincess.com>",
        to: [email],
        subject: "Registration Confirmed - Bonnie & Clyde Draft 2s",
        react: RegistrationConfirmationEmail({
          teamName: finalTeamName,
          player1,
          player2,
          email,
        }),
      });
    } catch (emailError) {
      // Log email error but don't fail the registration
      console.error("Failed to send confirmation email:", emailError);
      // Still return success since the pod was registered
    }

    // Return success response
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
        message: "Registration successful! Check your email for confirmation.",
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
