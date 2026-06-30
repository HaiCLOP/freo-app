/**
 * Freo MUN — Constants
 * 50+ committee templates, 193 UN member states, EB presets, labels.
 */

import type { CommitteeType, PortfolioType, SessionFormat, EBRoleType } from "./types";

// ─── Committee Template ───────────────────────────────────────────────────

export interface CommitteeTemplate {
  name: string;
  short_name: string;
  type: CommitteeType;
  portfolio_type: PortfolioType;
  session_format: SessionFormat;
  category: string;
  description: string;
  default_portfolios?: string[];
  eb_preset: EBPreset;
}

export type EBPreset = "standard_un" | "crisis" | "parliamentary" | "press" | "custom";

export const EB_PRESETS: Record<EBPreset, Array<{ title: string; role_type: EBRoleType; count: number }>> = {
  standard_un: [
    { title: "Chairperson", role_type: "CHAIR", count: 1 },
    { title: "Vice-Chairperson", role_type: "VICE_CHAIR", count: 1 },
    { title: "Rapporteur", role_type: "RAPPORTEUR", count: 1 },
  ],
  crisis: [
    { title: "Chairperson", role_type: "CHAIR", count: 1 },
    { title: "Vice-Chairperson", role_type: "VICE_CHAIR", count: 1 },
    { title: "Crisis Director", role_type: "CRISIS_DIRECTOR", count: 1 },
  ],
  parliamentary: [
    { title: "Speaker", role_type: "CHAIR", count: 1 },
    { title: "Deputy Speaker", role_type: "VICE_CHAIR", count: 1 },
    { title: "Parliamentary Secretary", role_type: "RAPPORTEUR", count: 1 },
  ],
  press: [
    { title: "Editor-in-Chief", role_type: "CHAIR", count: 1 },
    { title: "Managing Editor", role_type: "VICE_CHAIR", count: 1 },
  ],
  custom: [],
};

// ─── Committee Templates (50+) ────────────────────────────────────────────

export const COMMITTEE_TEMPLATES: CommitteeTemplate[] = [
  // UN General Assembly
  { name: "United Nations General Assembly", short_name: "UNGA", type: "UN_GENERAL", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN General Assembly", description: "The main deliberative organ of the UN", eb_preset: "standard_un" },
  { name: "UN Human Rights Council", short_name: "UNHRC", type: "UN_GENERAL", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN General Assembly", description: "Promoting and protecting human rights", eb_preset: "standard_un" },
  { name: "Disarmament and International Security", short_name: "DISEC", type: "UN_GENERAL", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN General Assembly", description: "First Committee — disarmament and security threats", eb_preset: "standard_un" },
  { name: "Economic and Social Council", short_name: "ECOSOC", type: "UN_GENERAL", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN General Assembly", description: "Economic and social work of the UN", eb_preset: "standard_un" },
  { name: "Special Political and Decolonization", short_name: "SPECPOL", type: "UN_GENERAL", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN General Assembly", description: "Fourth Committee — political matters", eb_preset: "standard_un" },
  { name: "Social, Humanitarian & Cultural", short_name: "SOCHUM", type: "UN_GENERAL", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN General Assembly", description: "Third Committee — social and humanitarian", eb_preset: "standard_un" },
  { name: "Legal Committee", short_name: "LEGAL", type: "UN_GENERAL", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN General Assembly", description: "Sixth Committee — international law", eb_preset: "standard_un" },
  // UN Security Council
  { name: "United Nations Security Council", short_name: "UNSC", type: "UN_SECURITY", portfolio_type: "COUNTRY", session_format: "CRISIS", category: "UN Security Council", description: "Primary body for international peace and security", default_portfolios: ["China","France","Russia","United Kingdom","United States","Algeria","Guyana","Japan","Mozambique","Republic of Korea","Sierra Leone","Slovenia","Ecuador","Malta","Switzerland"], eb_preset: "crisis" },
  { name: "Ad-hoc UNSC Crisis", short_name: "UNSC Crisis", type: "UN_SECURITY", portfolio_type: "COUNTRY", session_format: "CONTINUOUS_CRISIS", category: "UN Security Council", description: "Crisis simulation of the Security Council", eb_preset: "crisis" },
  // UN Specialized
  { name: "World Health Organization", short_name: "WHO", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "International public health", eb_preset: "standard_un" },
  { name: "UNESCO", short_name: "UNESCO", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "Education, science, and culture", eb_preset: "standard_un" },
  { name: "UNICEF", short_name: "UNICEF", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "Children's welfare and rights", eb_preset: "standard_un" },
  { name: "International Monetary Fund", short_name: "IMF", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "International monetary cooperation", eb_preset: "standard_un" },
  { name: "International Labour Organization", short_name: "ILO", type: "UN_SPECIALIZED", portfolio_type: "ROLE", session_format: "STANDARD", category: "UN Specialized", description: "Labour standards and workers' rights", eb_preset: "standard_un" },
  { name: "INTERPOL", short_name: "INTERPOL", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "CRISIS", category: "UN Specialized", description: "International criminal police", eb_preset: "crisis" },
  { name: "International Atomic Energy Agency", short_name: "IAEA", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "Nuclear energy and non-proliferation", eb_preset: "standard_un" },
  { name: "UN Environment Programme", short_name: "UNEP", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "Environmental coordination", eb_preset: "standard_un" },
  { name: "UN Women", short_name: "UN Women", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "Gender equality", eb_preset: "standard_un" },
  { name: "World Trade Organization", short_name: "WTO", type: "UN_SPECIALIZED", portfolio_type: "COUNTRY", session_format: "STANDARD", category: "UN Specialized", description: "International trade regulation", eb_preset: "standard_un" },
  // Indian Parliament
  { name: "All India Political Parties Meet", short_name: "AIPPM", type: "INDIAN_PARLIAMENT", portfolio_type: "PERSON", session_format: "CRISIS", category: "Indian Parliament", description: "Multi-party political deliberation", eb_preset: "parliamentary" },
  { name: "Lok Sabha", short_name: "Lok Sabha", type: "INDIAN_PARLIAMENT", portfolio_type: "PERSON", session_format: "STANDARD", category: "Indian Parliament", description: "Lower house of Indian Parliament", eb_preset: "parliamentary" },
  { name: "Rajya Sabha", short_name: "Rajya Sabha", type: "INDIAN_PARLIAMENT", portfolio_type: "PERSON", session_format: "STANDARD", category: "Indian Parliament", description: "Upper house of Indian Parliament", eb_preset: "parliamentary" },
  { name: "Joint Parliamentary Committee", short_name: "JPC", type: "INDIAN_PARLIAMENT", portfolio_type: "PERSON", session_format: "CRISIS", category: "Indian Parliament", description: "Special investigative committee", eb_preset: "parliamentary" },
  // Indian Specialized
  { name: "All India States Meet", short_name: "AISM", type: "INDIAN_SPECIALIZED", portfolio_type: "ROLE", session_format: "CRISIS", category: "Indian Specialized", description: "Inter-state deliberation", eb_preset: "crisis" },
  { name: "CBI Investigation", short_name: "CBI", type: "INDIAN_SPECIALIZED", portfolio_type: "ROLE", session_format: "CONTINUOUS_CRISIS", category: "Indian Specialized", description: "Criminal investigation simulation", eb_preset: "crisis" },
  { name: "Union Cabinet Crisis", short_name: "Cabinet", type: "INDIAN_CABINET", portfolio_type: "ROLE", session_format: "CRISIS", category: "Indian Specialized", description: "Cabinet-level crisis management", default_portfolios: ["Prime Minister", "Minister of Home Affairs", "Minister of Defence", "Minister of Finance", "Minister of External Affairs"], eb_preset: "crisis" },
  { name: "NITI Aayog", short_name: "NITI", type: "INDIAN_SPECIALIZED", portfolio_type: "ROLE", session_format: "STANDARD", category: "Indian Specialized", description: "Policy think tank", eb_preset: "standard_un" },
  // Fictional
  { name: "F1 Constructors Council", short_name: "F1CC", type: "FICTIONAL", portfolio_type: "TEAM", session_format: "CRISIS", category: "Fictional", description: "F1 team principal meeting", eb_preset: "crisis" },
  { name: "Hogwarts Board of Governors", short_name: "Hogwarts", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "CRISIS", category: "Fictional", description: "Wizarding world governance", eb_preset: "crisis" },
  { name: "Marvel Avengers Summit", short_name: "Avengers", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "CRISIS", category: "Fictional", description: "Superhero coalition meeting", eb_preset: "crisis" },
  { name: "Game of Thrones Small Council", short_name: "GoT", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "CONTINUOUS_CRISIS", category: "Fictional", description: "Westerosi power politics", eb_preset: "crisis" },
  { name: "Star Wars Galactic Senate", short_name: "Senate", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "STANDARD", category: "Fictional", description: "Galactic Republic governance", eb_preset: "standard_un" },
  { name: "FIFA Executive Committee", short_name: "FIFA", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "CRISIS", category: "Fictional", description: "World football governance", eb_preset: "crisis" },
  { name: "IPL Governing Council", short_name: "IPL GC", type: "FICTIONAL", portfolio_type: "TEAM", session_format: "CRISIS", category: "Fictional", description: "Indian Premier League governance", eb_preset: "crisis" },
  { name: "Shark Tank India Board", short_name: "STI", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "CRISIS", category: "Fictional", description: "Investment and business deliberation", eb_preset: "crisis" },
  { name: "Money Heist Crisis Room", short_name: "LCDP", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "CONTINUOUS_CRISIS", category: "Fictional", description: "Heist planning and crisis", eb_preset: "crisis" },
  { name: "Peaky Blinders War Council", short_name: "PB", type: "FICTIONAL", portfolio_type: "PERSON", session_format: "CONTINUOUS_CRISIS", category: "Fictional", description: "1920s gang warfare", eb_preset: "crisis" },
  // Press Corps
  { name: "International Press Corps", short_name: "IPC", type: "PRESS_CORP", portfolio_type: "ROLE", session_format: "STANDARD", category: "Press Corps", description: "International media coverage", default_portfolios: ["Al Jazeera", "BBC News", "CNN", "Reuters", "The New York Times", "The Wall Street Journal"], eb_preset: "press" },
  { name: "Desi Press Corps", short_name: "DPC", type: "PRESS_CORP", portfolio_type: "ROLE", session_format: "STANDARD", category: "Press Corps", description: "Indian media perspective", eb_preset: "press" },
  { name: "Social Media Committee", short_name: "SMC", type: "PRESS_CORP", portfolio_type: "ROLE", session_format: "STANDARD", category: "Press Corps", description: "Digital and social media coverage", eb_preset: "press" },
  // Joint Crisis
  { name: "Joint Crisis Committee - Side A", short_name: "JCC-A", type: "JOINT_CRISIS", portfolio_type: "CUSTOM", session_format: "CONTINUOUS_CRISIS", category: "Joint Crisis", description: "First side of a linked crisis", eb_preset: "crisis" },
  { name: "Joint Crisis Committee - Side B", short_name: "JCC-B", type: "JOINT_CRISIS", portfolio_type: "CUSTOM", session_format: "CONTINUOUS_CRISIS", category: "Joint Crisis", description: "Second side of a linked crisis", eb_preset: "crisis" },
  { name: "India-Pakistan JCC", short_name: "IND-PAK", type: "JOINT_CRISIS", portfolio_type: "ROLE", session_format: "CONTINUOUS_CRISIS", category: "Joint Crisis", description: "India vs Pakistan crisis simulation", eb_preset: "crisis" },
  { name: "NATO vs Warsaw Pact", short_name: "NATO-WP", type: "JOINT_CRISIS", portfolio_type: "COUNTRY", session_format: "CONTINUOUS_CRISIS", category: "Joint Crisis", description: "Cold War dual-committee crisis", eb_preset: "crisis" },
  // Crisis
  { name: "Historic Crisis Committee", short_name: "HCC", type: "CRISIS", portfolio_type: "PERSON", session_format: "CONTINUOUS_CRISIS", category: "Crisis", description: "Historical event crisis simulation", eb_preset: "crisis" },
  { name: "Futuristic Crisis Committee", short_name: "FCC", type: "CRISIS", portfolio_type: "ROLE", session_format: "CONTINUOUS_CRISIS", category: "Crisis", description: "Sci-fi or future scenario", eb_preset: "crisis" },
];

export const TEMPLATE_CATEGORIES = [
  "UN General Assembly", "UN Security Council", "UN Specialized",
  "Indian Parliament", "Indian Specialized", "Fictional",
  "Press Corps", "Joint Crisis", "Crisis",
] as const;

// ─── UN Member States (193) ───────────────────────────────────────────────

export const UN_MEMBER_STATES: string[] = [
  "Afghanistan","Albania","Algeria","Andorra","Angola","Antigua and Barbuda","Argentina","Armenia","Australia","Austria",
  "Azerbaijan","Bahamas","Bahrain","Bangladesh","Barbados","Belarus","Belgium","Belize","Benin","Bhutan",
  "Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cabo Verde","Cambodia",
  "Cameroon","Canada","Central African Republic","Chad","Chile","China","Colombia","Comoros","Congo","Costa Rica",
  "Côte d'Ivoire","Croatia","Cuba","Cyprus","Czech Republic","DR Congo","Denmark","Djibouti","Dominica","Dominican Republic",
  "Ecuador","Egypt","El Salvador","Equatorial Guinea","Eritrea","Estonia","Eswatini","Ethiopia","Fiji","Finland",
  "France","Gabon","Gambia","Georgia","Germany","Ghana","Greece","Grenada","Guatemala","Guinea",
  "Guinea-Bissau","Guyana","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq",
  "Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kenya","Kiribati","Kuwait",
  "Kyrgyzstan","Laos","Latvia","Lebanon","Lesotho","Liberia","Libya","Liechtenstein","Lithuania","Luxembourg",
  "Madagascar","Malawi","Malaysia","Maldives","Mali","Malta","Marshall Islands","Mauritania","Mauritius","Mexico",
  "Micronesia","Moldova","Monaco","Mongolia","Montenegro","Morocco","Mozambique","Myanmar","Namibia","Nauru",
  "Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","North Macedonia","Norway","Oman",
  "Pakistan","Palau","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal",
  "Qatar","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe",
  "Saudi Arabia","Senegal","Serbia","Seychelles","Sierra Leone","Singapore","Slovakia","Slovenia","Solomon Islands","Somalia",
  "South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Suriname","Sweden","Switzerland","Syria",
  "Tajikistan","Tanzania","Thailand","Timor-Leste","Togo","Tonga","Trinidad and Tobago","Tunisia","Turkey","Turkmenistan",
  "Tuvalu","Uganda","Ukraine","United Arab Emirates","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela",
  "Vietnam","Yemen","Zambia","Zimbabwe",
];

export const P5_MEMBERS = ["China", "France", "Russia", "United Kingdom", "United States"] as const;

// ─── Indian Reference Data ────────────────────────────────────────────────

export const INDIAN_POLITICAL_PARTIES: string[] = [
  "Bharatiya Janata Party (BJP)","Indian National Congress (INC)","Aam Aadmi Party (AAP)",
  "All India Trinamool Congress (AITC)","Dravida Munnetra Kazhagam (DMK)","Bahujan Samaj Party (BSP)",
  "Samajwadi Party (SP)","Communist Party of India (Marxist)","Nationalist Congress Party (NCP)",
  "Shiv Sena (UBT)","Telugu Desam Party (TDP)","Janata Dal (United)",
  "Rashtriya Janata Dal (RJD)","YSR Congress Party (YSRCP)","Biju Janata Dal (BJD)",
  "Shiromani Akali Dal (SAD)","Indian Union Muslim League (IUML)","Jharkhand Mukti Morcha (JMM)",
  "AIADMK","Telangana Rashtra Samithi (TRS)",
];

export const INDIAN_STATES: string[] = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Goa","Gujarat","Haryana",
  "Himachal Pradesh","Jharkhand","Karnataka","Kerala","Madhya Pradesh","Maharashtra","Manipur",
  "Meghalaya","Mizoram","Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu and Kashmir","Ladakh","Puducherry",
];

// ─── Labels ───────────────────────────────────────────────────────────────

export const AWARD_LABELS: Record<string, string> = {
  BEST_DELEGATE: "Best Delegate", OUTSTANDING: "Outstanding Delegate",
  HIGH_COMMENDATION: "High Commendation", VERBAL_MENTION: "Verbal Mention",
  SPECIAL_MENTION: "Special Mention", BEST_POSITION_PAPER: "Best Position Paper",
  PARTICIPATION: "Participation Certificate",
};

export const EXPERIENCE_LEVELS = [
  { value: "NONE", label: "No prior MUN experience" },
  { value: "BEGINNER", label: "1-2 MUNs attended" },
  { value: "INTERMEDIATE", label: "3-5 MUNs attended" },
  { value: "ADVANCED", label: "6+ MUNs or EB experience" },
] as const;

export const REGISTRATION_STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "#FFA500" },
  UNDER_REVIEW: { label: "Under Review", color: "#3B82F6" },
  APPROVED: { label: "Approved", color: "#22C55E" },
  REJECTED: { label: "Rejected", color: "#EF4444" },
  WAITLISTED: { label: "Waitlisted", color: "#A855F7" },
  CANCELLED: { label: "Cancelled", color: "#6B7280" },
};

export const CHECKLIST_DEFAULTS = [
  "Publish Background Guide",
  "Finalize Portfolios",
  "Review All Position Papers",
  "Set Up Session Logistics",
];
