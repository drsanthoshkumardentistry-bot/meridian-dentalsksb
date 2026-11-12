# Turning on "Send all on WhatsApp" (WhatsApp Business Platform)

The button stays hidden until the server has these two settings (Vercel environment variables, never in the code):

- `WHATSAPP_TOKEN`: a permanent access token from a Meta System User
- `WHATSAPP_PHONE_ID`: the Phone number ID of your WhatsApp Business number
- optional `WHATSAPP_TEMPLATE_LANG` (default `en`)

## One-time setup with Meta (free to open)
1. Create a Meta Business account at business.facebook.com and verify the business.
2. In developers.facebook.com create an app, add the WhatsApp product, and add a phone number that is not already on WhatsApp.
3. Create a System User, give it the WhatsApp permissions and generate a permanent token.
4. In WhatsApp Manager create these three templates, with exactly these names, in English. Replies from patients go to this number, so the texts tell patients to call the clinic.

| Name | Category | Text |
|---|---|---|
| `merident_appt_reminder` | Utility | Hello {{1}}, this is a reminder from {{2}} about your appointment {{3}} with {{4}}. Please arrive 10 minutes early. To reschedule, call the clinic on {{5}}. |
| `merident_payment_due` | Utility | Hello {{1}}, a reminder from {{2}}: Rs. {{3}} is pending on invoice {{4}}. Pay by UPI: {{5}}. If you have already paid, please ignore this message. |
| `merident_recall` | Marketing | Hello {{1}}, it has been {{2}} months since your last visit to {{3}}. A routine check-up helps catch problems early. To book a time, call the clinic on {{4}}. |

## What it costs (India, as reported in October 2026)
About Rs 0.145 per utility message (appointment and payment reminders) and Rs 1.09 per marketing message (recall). Check Meta's pricing page before launch. MeriDent pays these, so plan pricing around them.

## Safeguards built in
- Only these three templates can be sent. No free text.
- Only patients who agreed to WhatsApp messages are included.
- One login can send at most 150 messages a day.
