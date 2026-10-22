import { COUNTRY_LIST } from './countries';
export type QuestionId =
  | 'q1' | 'q2' | 'q3' | 'q4' | 'q5' | 'q6' | 'q7' | 'q9' | 'q8' | 'q10'
  | 'q11' | 'q12' | 'q13' | 'q14' | 'q15' | 'q16' | 'q17' | 'q18' | 'q19';

export type ModuleId = 'contact' | 'tax' | 'bank' | 'money' | 'id' | 'docs' | 'consents';

export interface FlowModule {
  id: ModuleId;
  title: string;
  minutes: number;
  questions: QuestionId[];
}

export const MODULES: FlowModule[] = [
  { id: 'contact', title: 'Contact details', minutes: 1, questions: ['q1'] },
  { id: 'tax', title: 'Tax', minutes: 2, questions: ['q2', 'q3', 'q4'] },
  { id: 'bank', title: 'Use of the bank', minutes: 3, questions: ['q5', 'q6', 'q7', 'q9', 'q8'] },
  { id: 'money', title: 'Money in and out', minutes: 4, questions: ['q10', 'q11', 'q12', 'q13', 'q14'] },
  { id: 'id', title: 'ID', minutes: 2, questions: ['q15', 'q16'] },
  { id: 'docs', title: 'Documents', minutes: 1, questions: ['q17'] },
  { id: 'consents', title: 'Consents', minutes: 1, questions: ['q18', 'q19'] },
];

/** Hub task names. */
export const TASK_NAMES: Record<QuestionId, string> = {
  q1: 'Contact information',
  q2: 'Place of birth',
  q3: 'Citizenship',
  q4: 'Tax',
  q5: 'Use of the bank',
  q6: 'Other banks',
  q7: 'Employment',
  q9: 'Regular payments in',
  q8: 'Connections abroad',
  q10: 'Other payments in',
  q11: 'Cash deposits',
  q12: 'Cash withdrawals',
  q13: 'Transfers from abroad',
  q14: 'Transfers abroad',
  q15: 'Photo ID',
  q16: 'Proof of address',
  q17: 'Requested documents',
  q18: 'Marketing',
  q19: 'Group consent',
};

export const ALL_QUESTIONS: QuestionId[] = MODULES.flatMap((m) => m.questions);

export function moduleOf(q: QuestionId): FlowModule {
  return MODULES.find((m) => m.questions.includes(q))!;
}

/** Country dropdowns: Denmark, the Nordic countries, then A–Z (all ISO 3166-1 countries). */
export const COUNTRIES: string[] = COUNTRY_LIST.map((c) => c.name);

/** Q3 citizenship list with round flags (flag-icons 1x1, MIT). Same order as COUNTRIES. */
export const FLAG_COUNTRIES: { name: string; flag: string }[] = COUNTRY_LIST.map((c) => ({
  name: c.name,
  flag: `flags/1x1/${c.code}.svg`,
}));

export const COUNTRY_CODES = ['+45', '+46', '+47', '+358', '+354', '+49', '+44', '+1'];

export const FREQUENCIES = ['Every week', 'Every 2 weeks', 'Every month', 'Every quarter', 'Every year'];

export const USAGE_OPTIONS = [
  'Everyday account', 'Cards', 'Online banking', 'NemKonto', 'Savings', 'Pension savings',
  'Investments', 'Bank loans', 'Mortgage', 'Other',
];

export const EMPLOYMENT_OPTIONS = [
  'Employee', 'Self-employed', 'Part-time or side job', 'Student', 'Retired', 'Early retired',
  'Not working', 'Other',
];

export const REGULAR_TYPES = [
  'Salary', 'Pension', 'Transfer income', 'Public benefits', 'SU (student grant and loan)',
  'Return on investments', 'Fees', 'Income from a hobby business',
];

export const CONNECTION_TYPES = [
  'Financial commitments', 'Family', 'Social or professional network', 'Main place of business',
];

export const ID_TYPES = ['Driving licence', 'Passport'];
export const ADDRESS_DOC_TYPES = ['Health insurance card', 'Utility bill', 'Rental agreement'];

export type YesNo = 'yes' | 'no' | '';

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  status: 'uploading' | 'uploaded';
}

export interface RegularDetail {
  amount: string;
  frequency: string;
}

export interface Answers {
  phoneCode: string;
  phone: string;
  email: string;
  birthCountry: string;
  birthCity: string;
  citizenships: string[];
  taxDk: YesNo;
  taxOther: YesNo;
  taxOtherCountry: string;
  tin: string;
  usage: string[];
  mainBank: YesNo;
  otherBanks: YesNo;
  employment: string[];
  jobTitle: string;
  employer: string;
  regular: YesNo;
  regularTypes: string[];
  regularDetails: Record<string, RegularDetail>;
  connections: YesNo;
  connectionCountry: string;
  connectionTypes: string[];
  connectionText: string;
  otherPaymentsTotal: string;
  otherPaymentsSource: string;
  cashDeposits: YesNo;
  depositsPerYear: string;
  depositsTotal: string;
  depositsSource: string;
  cashWithdrawals: YesNo;
  withdrawalsPerYear: string;
  withdrawalsTotal: string;
  withdrawalsUse: string;
  transfersIn: YesNo;
  transfersInCountry: string;
  transfersInPerYear: string;
  transfersInTotal: string;
  transfersInPurpose: string;
  transfersOut: YesNo;
  transfersOutCountry: string;
  transfersOutPerYear: string;
  transfersOutTotal: string;
  transfersOutPurpose: string;
  idType: string;
  idFiles: UploadedFile[];
  addressDocType: string;
  addressFiles: UploadedFile[];
  adviserFiles: UploadedFile[];
  adviserComment: string;
  marketing: YesNo;
  groupConsent: YesNo;
}

export function demoAnswers(): Answers {
  return {
    phoneCode: '+45',
    phone: '20 12 34 56',
    email: 'thomas.christensen@mail.dk',
    birthCountry: 'Denmark',
    birthCity: 'Odense',
    citizenships: [],
    taxDk: 'yes',
    taxOther: 'yes',
    taxOtherCountry: 'Belgium',
    tin: '850101 123 45',
    usage: ['Everyday account', 'Cards', 'Online banking', 'Savings'],
    mainBank: 'yes',
    otherBanks: 'no',
    employment: ['Employee'],
    jobTitle: 'Project manager',
    employer: 'Danfoss A/S',
    regular: 'yes',
    regularTypes: ['Salary'],
    regularDetails: { Salary: { amount: '32,000', frequency: 'Every month' } },
    connections: 'yes',
    connectionCountry: 'Sweden',
    connectionTypes: ['Family'],
    connectionText: 'My sister lives in Malmö.',
    otherPaymentsTotal: '15,000',
    otherPaymentsSource: 'Selling things online and MobilePay',
    cashDeposits: 'yes',
    depositsPerYear: '',
    depositsTotal: '',
    depositsSource: '',
    cashWithdrawals: 'yes',
    withdrawalsPerYear: '12',
    withdrawalsTotal: '6,000',
    withdrawalsUse: 'Flea markets and small purchases',
    transfersIn: 'yes',
    transfersInCountry: 'Sweden',
    transfersInPerYear: '4',
    transfersInTotal: '20,000',
    transfersInPurpose: 'Gifts from my family in Sweden',
    transfersOut: 'no',
    transfersOutCountry: '',
    transfersOutPerYear: '',
    transfersOutTotal: '',
    transfersOutPurpose: '',
    idType: 'Driving licence',
    idFiles: [{ id: 'f1', name: 'driving-licence-front.jpg', size: 245 * 1024, status: 'uploaded' }],
    addressDocType: 'Health insurance card',
    addressFiles: [],
    adviserFiles: [{ id: 'f2', name: 'aarsopgoerelse-2025.pdf', size: 245 * 1024, status: 'uploaded' }],
    adviserComment: '',
    marketing: 'yes',
    groupConsent: 'yes',
  };
}
