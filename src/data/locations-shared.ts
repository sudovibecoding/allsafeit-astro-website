/**
 * Shared content used across primary location pages (Pasadena, Los Angeles,
 * Orange County). Onboarding process copy is identical on all three; map
 * embed URLs differ per office.
 */

export const ONBOARDING_PHASES = [
  {
    number: 1,
    title: 'Discovery and planning',
    body: "We start with a conversation about your business, current technology, what's working. This is where we learn what you need. Not what we want to sell. Expert guidance ensures strategic IT planning from day one.",
  },
  {
    number: 2,
    title: 'Understanding your environment',
    body: 'Our team maps your IT infrastructure, documents what exists, identifies gaps, establishes baselines. By the end, we know your network as well as you do.',
  },
  {
    number: 3,
    title: 'Team integration',
    body: 'We talk to your people about how they work, what breaks, what slows them down. This is where we stop being a vendor and start being your partner providing dedicated support.',
  },
  {
    number: 4,
    title: 'Protection and monitoring',
    body: 'We deploy 24/7 network monitoring, endpoint security, tools that catch problems before you feel them. This includes backup and disaster recovery, managed firewall, email security, dark web monitoring, vulnerability scanning, and penetration testing. Your business continuity is protected.',
  },
  {
    number: 5,
    title: 'Service delivery',
    body: "Everything goes live. Your team gains access to support, meets people helping them, understands how to get help. We clean up technical debt and make sure your foundation is solid. You're live. Technology is finally working for you.",
  },
] as const;

/**
 * Boxed-icon SVGs (Font Awesome paths from the Webflow source) for the
 * "Problems We Solve" accordion on each location page. Shared across
 * Pasadena / LA / Orange County — the icon set is the same; only the
 * accompanying copy varies by city.
 */
export const PROBLEM_ICONS = {
  wifi:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true"><path d="M320 160C229.1 160 146.8 196 86.3 254.6C73.6 266.9 53.3 266.6 41.1 253.9C28.9 241.2 29.1 220.9 41.8 208.7C113.7 138.9 211.9 96 320 96C428.1 96 526.3 138.9 598.3 208.7C611 221 611.3 241.3 599 253.9C586.7 266.5 566.4 266.9 553.8 254.6C493.2 196 410.9 160 320 160zM272 496C272 469.5 293.5 448 320 448C346.5 448 368 469.5 368 496C368 522.5 346.5 544 320 544C293.5 544 272 522.5 272 496zM200 390.2C188.3 403.5 168.1 404.7 154.8 393C141.5 381.3 140.3 361.1 152 347.8C193 301.4 253.1 272 320 272C386.9 272 447 301.4 488 347.8C499.7 361.1 498.4 381.3 485.2 393C472 404.7 451.7 403.4 440 390.2C410.6 356.9 367.8 336 320 336C272.2 336 229.4 356.9 200 390.2z"/></svg>',
  shield: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true"><path d="M320 64C324.6 64 329.2 65 333.4 66.9L521.8 146.8C543.8 156.1 560.2 177.8 560.1 204C559.6 303.2 518.8 484.7 346.5 567.2C329.8 575.2 310.4 575.2 293.7 567.2C121.3 484.7 80.6 303.2 80.1 204C80 177.8 96.4 156.1 118.4 146.8L306.7 66.9C310.9 65 315.4 64 320 64zM320 130.8L320 508.9C458 442.1 495.1 294.1 496 205.5L320 130.9L320 130.9z"/></svg>',
  dollar: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true"><path d="M392 176L248 176L210.7 101.5C208.9 97.9 208 93.9 208 89.9C208 75.6 219.6 64 233.9 64L406.1 64C420.4 64 432 75.6 432 89.9C432 93.9 431.1 97.9 429.3 101.5L392 176zM233.6 224L406.4 224L455.1 264.6C521.6 320 560 402 560 488.5C560 536.8 520.8 576 472.5 576L167.4 576C119.2 576 80 536.8 80 488.5C80 402 118.4 320 184.9 264.6L233.6 224zM324 288C313 288 304 297 304 308L304 312C275.2 312.3 252 335.7 252 364.5C252 390.2 270.5 412.1 295.9 416.3L337.6 423.3C343.6 424.3 348 429.5 348 435.6C348 442.5 342.4 448.1 335.5 448.1L280 448C269 448 260 457 260 468C260 479 269 488 280 488L304 488L304 492C304 503 313 512 324 512C335 512 344 503 344 492L344 487.3C369 483.2 388 461.6 388 435.5C388 409.8 369.5 387.9 344.1 383.7L302.4 376.7C296.4 375.7 292 370.5 292 364.4C292 357.5 297.6 351.9 304.5 351.9L352 351.9C363 351.9 372 342.9 372 331.9C372 320.9 363 311.9 352 311.9L344 311.9L344 307.9C344 296.9 335 287.9 324 287.9z"/></svg>',
  doc:    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true"><path d="M439.4 96L448 96C483.3 96 512 124.7 512 160L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 160C128 124.7 156.7 96 192 96L200.6 96C211.6 76.9 232.3 64 256 64L384 64C407.7 64 428.4 76.9 439.4 96zM376 176C389.3 176 400 165.3 400 152C400 138.7 389.3 128 376 128L264 128C250.7 128 240 138.7 240 152C240 165.3 250.7 176 264 176L376 176zM256 320C256 302.3 241.7 288 224 288C206.3 288 192 302.3 192 320C192 337.7 206.3 352 224 352C241.7 352 256 337.7 256 320zM288 320C288 333.3 298.7 344 312 344L424 344C437.3 344 448 333.3 448 320C448 306.7 437.3 296 424 296L312 296C298.7 296 288 306.7 288 320zM288 448C288 461.3 298.7 472 312 472L424 472C437.3 472 448 461.3 448 448C448 434.7 437.3 424 424 424L312 424C298.7 424 288 434.7 288 448zM224 480C241.7 480 256 465.7 256 448C256 430.3 241.7 416 224 416C206.3 416 192 430.3 192 448C192 465.7 206.3 480 224 480z"/></svg>',
  bolt:   '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true"><path d="M272 88C272 74.7 282.7 64 296 64L344 64C357.3 64 368 74.7 368 88L368 144L424 144C437.3 144 448 154.7 448 168L448 216C448 229.3 437.3 240 424 240L368 240L368 296C368 309.3 357.3 320 344 320L296 320C282.7 320 272 309.3 272 296L272 240L216 240C202.7 240 192 229.3 192 216L192 168C192 154.7 202.7 144 216 144L272 144L272 88zM98.7 448L141.2 405.5C165.2 381.5 197.8 368 231.7 368L384 368C401.7 368 416 382.3 416 400C416 417.7 401.7 432 384 432L312 432C298.7 432 288 442.7 288 456C288 469.3 298.7 480 312 480L424.6 480L544.3 391.8C562.1 378.7 587.1 382.5 600.2 400.3C613.3 418.1 609.5 443.1 591.7 456.2L465.1 549.5C441.7 566.7 413.5 576 384.4 576L64 576C46.3 576 32 561.7 32 544L32 480C32 462.3 46.3 448 64 448L98.7 448z"/></svg>',
  people: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true"><path d="M96 192C96 130.1 146.1 80 208 80C269.9 80 320 130.1 320 192C320 253.9 269.9 304 208 304C146.1 304 96 253.9 96 192zM32 528C32 430.8 110.8 352 208 352C305.2 352 384 430.8 384 528L384 534C384 557.2 365.2 576 342 576L74 576C50.8 576 32 557.2 32 534L32 528zM464 128C517 128 560 171 560 224C560 277 517 320 464 320C411 320 368 277 368 224C368 171 411 128 464 128zM464 368C543.5 368 608 432.5 608 512L608 534.4C608 557.4 589.4 576 566.4 576L421.6 576C428.2 563.5 432 549.2 432 534L432 528C432 476.5 414.6 429.1 385.5 391.3C408.1 376.6 435.1 368 464 368z"/></svg>',
  growth: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" fill="currentColor" aria-hidden="true"><path d="M576 128C593.7 128 608 142.3 608 160L608 480C608 497.7 593.7 512 576 512C558.3 512 544 497.7 544 480L544 237.3L374.6 406.7C362.1 419.2 341.8 419.2 329.3 406.7L240 317.3L86.6 470.6C74.1 483.1 53.8 483.1 41.3 470.6C28.8 458.1 28.8 437.8 41.3 425.3L217.3 249.3C229.8 236.8 250.1 236.8 262.6 249.3L352 338.7L498.8 192L480 192C462.3 192 448 177.7 448 160C448 142.3 462.3 128 480 128L576 128z"/></svg>',
} as const;

export const MAP_EMBEDS = {
  pasadena:
    'https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d13208.024893715408!2d-118.1468895!3d34.1461829!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80c2bf205ed5fb19%3A0xe770eec7ff0a3b17!2sAllSafe%20IT!5e0!3m2!1sen!2sza!4v1705154134247!5m2!1sen!2sza',
  losAngeles:
    'https://maps.google.com/maps?q=1800+N+Vine+St+Hollywood+CA+90028&output=embed',
  orangeCounty:
    'https://maps.google.com/maps?q=4695+MacArthur+Ct+Newport+Beach+CA+92660&output=embed',
} as const;
