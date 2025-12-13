import * as React from "react";

interface TournamentAnnouncementEmailProps {
  player1: string;
}

export function TournamentAnnouncementEmail({
  player1,
}: TournamentAnnouncementEmailProps) {
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
            🏐 Tournament Website is Live!
          </h1>
          <p style={{ margin: "10px 0 0 0", fontSize: "16px", opacity: 0.9 }}>
            Two Peas Pod Tournament
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
            Great news! The tournament website is now live with real-time
            standings, schedules, and live scoring. You can follow all the
            action throughout the day! Be sure to send this information to your
            fellow pea!
          </p>

          {/* Website Links */}
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
              Visit the Website
            </h2>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Tournament Hub:</strong>
              <br />
              <a
                href="https://hewwopwincess.com"
                style={{
                  color: "#727D73",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                hewwopwincess.com
              </a>
            </p>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Live Standings:</strong>
              <br />
              <a
                href="https://hewwopwincess.com/standings"
                style={{
                  color: "#727D73",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                hewwopwincess.com/standings
              </a>
            </p>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Schedule &amp; Live Scores:</strong>
              <br />
              <a
                href="https://hewwopwincess.com/schedule"
                style={{
                  color: "#727D73",
                  textDecoration: "none",
                  fontWeight: "bold",
                }}
              >
                hewwopwincess.com/schedule
              </a>
            </p>
          </div>

          {/* Tournament Reminders */}
          <h2
            style={{
              fontSize: "20px",
              color: "#727D73",
              marginTop: "30px",
              marginBottom: "15px",
            }}
          >
            Important Reminders
          </h2>

          <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
            <p style={{ margin: "8px 0" }}>
              <strong>📅 Date:</strong> Saturday, Decemeber 13th, 2025
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>🕘 Arrival Time:</strong> 9:30 AM for check-in &amp;
              warm-up
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>🕐 Games Start:</strong> 10:00 AM sharp
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>📍 Location:</strong> All American FieldHouse
              <br />
              <span style={{ paddingLeft: "24px", display: "block" }}>
                1 Racquet Ln, Monroeville, PA 15146
              </span>
            </p>
            <p style={{ margin: "8px 0" }}>
              <strong>🏐 Court:</strong> Champions Court
            </p>
          </div>

          {/* Important Notes */}
          <div
            style={{
              backgroundColor: "#FFF8E1",
              padding: "15px",
              borderRadius: "8px",
              margin: "20px 0",
              borderLeft: "4px solid #FFB74D",
            }}
          >
            <h3
              style={{
                margin: "0 0 10px 0",
                fontSize: "16px",
                color: "#F57C00",
              }}
            >
              Please Note
            </h3>
            <ul
              style={{
                fontSize: "14px",
                lineHeight: "1.6",
                margin: 0,
                paddingLeft: "20px",
              }}
            >
              <li>
                Play times are <strong>estimates</strong> - games may start
                early if we&apos;re ahead of schedule!
              </li>
              <li>Check-in begins at 9:30 AM - please arrive on time</li>
            </ul>
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
            Tournament Format
          </h2>

          <ul
            style={{
              fontSize: "15px",
              lineHeight: "1.8",
              paddingLeft: "20px",
            }}
          >
            <li>
              <strong>Pool Play:</strong> 4 rounds of 6v6 matches (games to 21,
              win by 2, cap at 25)
            </li>
            <li>
              <strong>Random Teams:</strong> You&apos;ll play with different
              partners each game
            </li>
            <li>
              <strong>Live Scoring:</strong> Follow real-time scores on the
              website
            </li>
            <li>
              <strong>Real-time Standings:</strong> See rankings update after
              each game
            </li>
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
              Questions? Reply to this email or reach out to the tournament
              organizer.
            </p>
            <p
              style={{
                fontSize: "15px",
                lineHeight: "1.6",
                marginTop: "15px",
              }}
            >
              See you Saturday!
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
            Hewwo Pwincess
            <br />
            All American FieldHouse, Monroeville, PA
          </p>
        </div>
      </div>
    </div>
  );
}
