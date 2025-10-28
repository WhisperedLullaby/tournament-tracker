import * as React from "react";

interface RegistrationConfirmationEmailProps {
  teamName: string;
  player1: string;
  player2: string;
  email: string;
}

export function RegistrationConfirmationEmail({
  teamName,
  player1,
  player2,
  email,
}: RegistrationConfirmationEmailProps) {
  return (
    <div style={{ fontFamily: "Arial, sans-serif", color: "#333" }}>
      <div
        style={{
          maxWidth: "600px",
          margin: "0 auto",
          padding: "20px",
          backgroundColor: "#f9f9f9",
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: "#727D73",
            color: "#fff",
            padding: "30px 20px",
            textAlign: "center",
            borderRadius: "8px 8px 0 0",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "28px" }}>
            Welcome to Bonnie & Clyde!
          </h1>
          <p style={{ margin: "10px 0 0 0", fontSize: "16px", opacity: 0.9 }}>
            Registration Confirmed
          </p>
        </div>

        {/* Content */}
        <div
          style={{
            backgroundColor: "#fff",
            padding: "30px",
            borderRadius: "0 0 8px 8px",
          }}
        >
          <p style={{ fontSize: "16px", lineHeight: "1.6", marginTop: 0 }}>
            Hi <strong>{player1}</strong>,
          </p>

          <p style={{ fontSize: "16px", lineHeight: "1.6" }}>
            You&apos;re all set! Your pod has been successfully registered for the
            Bonnie & Clyde Draft 2s tournament.
          </p>

          {/* Team Info Box */}
          <div
            style={{
              backgroundColor: "#F0F0D7",
              padding: "20px",
              borderRadius: "8px",
              margin: "20px 0",
              borderLeft: "4px solid #AAB99A",
            }}
          >
            <h2
              style={{
                margin: "0 0 15px 0",
                fontSize: "20px",
                color: "#727D73",
              }}
            >
              Your Team
            </h2>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Team Name:</strong> {teamName}
            </p>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Captain:</strong> {player1}
            </p>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Partner:</strong> {player2}
            </p>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Email:</strong> {email}
            </p>
          </div>

          {/* Tournament Details */}
          <h2
            style={{
              fontSize: "20px",
              color: "#727D73",
              marginTop: "30px",
              marginBottom: "15px",
            }}
          >
            Tournament Details
          </h2>

          <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
            <p style={{ margin: "8px 0" }}>
              <strong>📅 Date:</strong> Saturday, November 1st, 2025
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>🕐 Time:</strong> 10:00 AM - 2:00 PM
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>📍 Location:</strong> All American FieldHouse
              <br />
              <span style={{ paddingLeft: "24px", display: "block" }}>
                1 Racquet Ln, Monroeville, PA 15146
              </span>
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>🏆 Prize:</strong> Winners get their registration fee
              back!
            </p>
          </div>

          {/* What to Expect */}
          <h2
            style={{
              fontSize: "20px",
              color: "#727D73",
              marginTop: "30px",
              marginBottom: "15px",
            }}
          >
            What to Expect
          </h2>

          <ul
            style={{
              fontSize: "15px",
              lineHeight: "1.8",
              paddingLeft: "20px",
            }}
          >
            <li>
              <strong>Pool Play:</strong> 4 rounds of 6v6 matches to determine
              seeding
            </li>
            <li>
              <strong>Bracket Play:</strong> Double elimination tournament with
              balanced teams
            </li>
            <li>
              <strong>Reverse Coed Rules:</strong> Women&apos;s net height, special
              restrictions for male players
            </li>
            <li>
              <strong>Rally Scoring:</strong> Games to 25 points, every serve
              scores
            </li>
          </ul>

          {/* What to Bring */}
          <h2
            style={{
              fontSize: "20px",
              color: "#727D73",
              marginTop: "30px",
              marginBottom: "15px",
            }}
          >
            What to Bring
          </h2>

          <ul
            style={{
              fontSize: "15px",
              lineHeight: "1.8",
              paddingLeft: "20px",
            }}
          >
            <li>Court shoes (no black soles)</li>
            <li>Water bottle</li>
            <li>Knee pads (optional but recommended)</li>
            <li>Your A-game!</li>
          </ul>

          {/* Footer Message */}
          <div
            style={{
              marginTop: "30px",
              paddingTop: "20px",
              borderTop: "1px solid #ddd",
            }}
          >
            <p style={{ fontSize: "15px", lineHeight: "1.6", margin: 0 }}>
              We&apos;ll send you more details closer to the tournament date. If you
              have any questions, feel free to reply to this email.
            </p>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                marginTop: "15px",
              }}
            >
              See you on the court! 🏐
            </p>
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            textAlign: "center",
            padding: "20px",
            fontSize: "13px",
            color: "#666",
          }}
        >
          <p style={{ margin: 0 }}>
            Bonnie & Clyde Draft 2s Tournament
            <br />
            All American FieldHouse, Monroeville, PA
          </p>
        </div>
      </div>
    </div>
  );
}
