import * as React from "react";

function formatTime(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

interface TournamentAnnouncementEmailProps {
  player1: string;
  tournamentName: string;
  tournamentDate: Date;
  slug: string;
  location?: string | null;
  startTime?: string | null;
  estimatedEndTime?: string | null;
  poolPlayDescription?: string | null;
  bracketPlayDescription?: string | null;
  prizeInfo?: string | null;
}

export function TournamentAnnouncementEmail({
  player1,
  tournamentName,
  tournamentDate,
  slug,
  location,
  startTime,
  estimatedEndTime,
  poolPlayDescription,
  bracketPlayDescription,
  prizeInfo,
}: TournamentAnnouncementEmailProps) {
  const formattedDate = new Date(tournamentDate).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  });

  const dayOfWeek = new Date(tournamentDate).toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });

  const baseUrl = "https://hewwopwincess.com";
  const tournamentUrl = `${baseUrl}/tournaments/${slug}`;

  const timeRange = startTime
    ? `${formatTime(startTime)}${estimatedEndTime ? ` – ${formatTime(estimatedEndTime)}` : ""}`
    : null;

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
            {tournamentName}
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
            action throughout the day!
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
                href={tournamentUrl}
                style={{ color: "#727D73", textDecoration: "none", fontWeight: "bold" }}
              >
                {tournamentUrl.replace("https://", "")}
              </a>
            </p>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Live Standings:</strong>
              <br />
              <a
                href={`${tournamentUrl}/standings`}
                style={{ color: "#727D73", textDecoration: "none", fontWeight: "bold" }}
              >
                {`${tournamentUrl}/standings`.replace("https://", "")}
              </a>
            </p>
            <p style={{ margin: "8px 0", fontSize: "15px" }}>
              <strong>Schedule &amp; Live Scores:</strong>
              <br />
              <a
                href={`${tournamentUrl}/schedule`}
                style={{ color: "#727D73", textDecoration: "none", fontWeight: "bold" }}
              >
                {`${tournamentUrl}/schedule`.replace("https://", "")}
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
              <strong>📅 Date:</strong> {formattedDate}
            </p>
            {timeRange && (
              <p style={{ margin: "8px 0" }}>
                <strong>🕐 Time:</strong> {timeRange}
              </p>
            )}
            {location && (
              <p style={{ margin: "8px 0" }}>
                <strong>📍 Location:</strong> {location}
              </p>
            )}
            {prizeInfo && (
              <p style={{ margin: "8px 0" }}>
                <strong>🏆 Prize:</strong> {prizeInfo.split("\n")[0]}
              </p>
            )}
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
              style={{ margin: "0 0 10px 0", fontSize: "16px", color: "#F57C00" }}
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
                Play times are <strong>estimates</strong> — games may start
                early if we&apos;re ahead of schedule!
              </li>
              {startTime && <li>Please arrive a few minutes early to check in</li>}
            </ul>
          </div>

          {/* Tournament Format */}
          {(poolPlayDescription || bracketPlayDescription) && (
            <>
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
              <div style={{ fontSize: "15px", lineHeight: "1.8" }}>
                {poolPlayDescription && (
                  <p style={{ margin: "8px 0", whiteSpace: "pre-line" }}>
                    {poolPlayDescription}
                  </p>
                )}
                {bracketPlayDescription && (
                  <p style={{ margin: "8px 0", whiteSpace: "pre-line" }}>
                    {bracketPlayDescription}
                  </p>
                )}
              </div>
            </>
          )}

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
            <p style={{ fontSize: "15px", lineHeight: "1.6", marginTop: "15px" }}>
              See you {dayOfWeek}! 🏐
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
            {tournamentName}
            {location && (
              <>
                <br />
                {location}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
