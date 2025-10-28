import { Resend } from "resend";
import { config } from "dotenv";

config({ path: ".env.local" });

const resend = new Resend(process.env.RESEND_API_KEY);

async function testResend() {
  console.log("Testing Resend API...");
  console.log("API Key:", process.env.RESEND_API_KEY ? "Set ✓" : "Not set ✗");

  try {
    const result = await resend.emails.send({
      from: "Hewwopwincess Tournament <onboarding@resend.dev>",
      to: ["agnone.anthony@gmail.com"], // Your test email
      subject: "Test Email from Tournament App",
      html: "<p>This is a test email. If you receive this, Resend is working!</p>",
    });

    console.log("✓ Email sent successfully!");
    console.log("Result:", result);
  } catch (error) {
    console.error("✗ Email failed:");
    console.error(error);
  }
}

testResend();
