type SendSmsInput = {
  to: string;
  body: string;
};

export async function sendSms({ to, body }: SendSmsInput) {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromPhoneNumber = process.env.TWILIO_FROM_PHONE_NUMBER;

  if (!accountSid || !authToken || !fromPhoneNumber) {
    console.warn("Twilio is not configured. SMS not sent.", {
      to,
      body,
    });

    return {
      success: false,
      skipped: true,
      reason: "Twilio is not configured",
    };
  }

  // TODO:
  // Installer le package twilio et envoyer le vrai SMS :
  // npm install twilio
  //
  // const twilio = (await import("twilio")).default;
  // const client = twilio(accountSid, authToken);
  // await client.messages.create({
  //   body,
  //   from: fromPhoneNumber,
  //   to,
  // });

  console.log("SMS ready to send", { to, body });

  return {
    success: true,
    skipped: true,
    reason: "SMS sending is prepared but not enabled yet",
  };
}
