# KAV / קו - frontend design direction

Fictional neighborhood barbershop in Florentin, Tel Aviv. One barber (Itay Cohen),
one 30-minute men's haircut, NIS 90. The page's job is to make choosing a slot
simple on a phone. All customer-facing copy is Hebrew, with RTL layout.

## Reference synthesis

- Mobile orange references: rounded date/time buttons and persistent booking CTA.
- HairSalon landing page: confident sans-serif headline and warm orange action.
- Black/yellow reference: restrained contrast between warm surfaces and dark bands.
- Barbonic identity: characterful branding and close-up craft photography.
- Vellora: generous breathing room, a personal story, and useful FAQ section.
- Belysh: olive contrast, tactile shop imagery, clear opening hours.

Avoid copying marketplace search, categories, products, multiple barbers, or
promotions: they would complicate the single-barber POC.

## Tokens

- Paper: #F7F5EF
- Surface: #FFFEFA
- Ink: #282B26
- Olive: #29372E
- Burnt orange: #B34B28 (darkened during accessibility review for text contrast)
- Honey: #EDC078
- Muted text: #686B60
- Display: Secular One, Hebrew, regular.
- Body and utility: Heebo, Hebrew/Latin, 400/500/600/700.

## Composition

Desktop: Hebrew hero text on the right, barber photo on the left; inline booking
with a dark service summary beside the light date/time picker.

Mobile: compact navigation, headline and booking CTA, photo, inline picker,
story/gallery/visit/FAQ, persistent bottom booking action. Confirmation is a
native dialog presented as a bottom sheet.

Signature: the punched appointment ticket attached to the hero photograph,
repeated as the confirmed appointment summary. Warm imagery and one honey seal
carry the expression; supporting controls remain quiet.

## Interaction and scope

The date picker, period filters, details form, demo verification, confirmation,
calendar export, appointment management, and cancellation are interactive.
Verification uses an explicitly displayed demo code (123456). No message is sent.
A mock appointment lives in sessionStorage; phone numbers and codes are not saved.
This does not implement authentication, secure OTPs, or real booking protection.

No external deployment, Meta setup, or Supabase connection is part of this pass.
Mock data is isolated in frontend/src/demo.js for later integration.

## Image sources

Local stock image copies, originally from Unsplash; no generated images or imagery
extracted from the inspiration screenshots. Photographs illustrate a fictional
business and do not imply the pictured people own or endorse it.

- barber.jpg: https://unsplash.com/photos/a-man-getting-his-hair-cut-at-a-barber-shop-2hCDn1YxbEM
  https://images.unsplash.com/photo-1703792686383-4f307cbfa544
- haircut.jpg: https://unsplash.com/photos/9ORXOd7g01s
  https://images.unsplash.com/photo-1686671805337-7d8aa64b965f
- studio.jpg: https://images.unsplash.com/photo-1585747860715-2ba37e788b70
- chair.jpg: https://unsplash.com/photos/black-and-white-barber-chair-2BnUHAFOeZk
  https://images.unsplash.com/photo-1591036746996-c4eced9e8503

Font packages include their respective open-source font licenses.
