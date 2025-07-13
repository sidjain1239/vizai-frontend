import nodemailer from 'nodemailer';

export async function POST(req) {
  try {
    const { to, subject, html } = await req.json();

    // Configure transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for port 465, false for other ports
      auth: {
        user: "sjcode1234@gmail.com",
        pass: "mund ciwo zbib imfi",
      },
    });

    // Define mail options with HTML
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      html, // Sending HTML content
    };

    // Send mail
    await transporter.sendMail(mailOptions);
    return new Response(JSON.stringify({ message: 'Email sent successfully' }), { status: 200 });
  } catch (error) {
    console.error('Error sending email:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}