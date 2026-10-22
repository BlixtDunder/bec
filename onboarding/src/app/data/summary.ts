import { Answers, ModuleId, UploadedFile } from './flow';

function joinAnd(list: string[]): string {
  if (list.length <= 1) return list.join('');
  return `${list.slice(0, -1).join(', ')} and ${list[list.length - 1]}`;
}

function friendlyFile(f: UploadedFile): string {
  const m = /aarsopgoerelse-(\d{4})/i.exec(f.name);
  return m ? `Annual tax statement ${m[1]}` : f.name;
}

/** One-line summaries for the Review screen, generated from the answers. */
export function summarize(id: ModuleId, a: Answers): string {
  switch (id) {
    case 'contact':
      return [`${a.phoneCode} ${a.phone}`.trim(), a.email].filter(Boolean).join(' · ');
    case 'tax': {
      const parts: string[] = [];
      if (a.birthCity || a.birthCountry) parts.push(`Born in ${a.birthCity || a.birthCountry}`);
      const res = [
        ...(a.taxDk === 'yes' ? ['Denmark'] : []),
        ...(a.taxOther === 'yes' && a.taxOtherCountry ? [a.taxOtherCountry] : []),
      ];
      if (res.length) parts.push(`Tax resident in ${joinAnd(res)}`);
      return parts.join(' · ');
    }
    case 'bank': {
      const parts = [a.mainBank === 'yes' ? 'Main bank' : 'Not main bank'];
      if (a.employment.includes('Employee') && a.employer) parts.push(`Employee at ${a.employer}`);
      else if (a.employment.length) parts.push(a.employment[0]);
      return parts.join(' · ');
    }
    case 'money': {
      const parts: string[] = [];
      if (a.cashWithdrawals === 'yes') parts.push('Cash withdrawals');
      if (a.cashDeposits === 'yes' && (a.depositsPerYear || a.depositsTotal)) parts.push('Cash deposits');
      if (a.transfersIn === 'yes') parts.push(`Transfers from ${a.transfersInCountry || 'abroad'}`);
      if (a.transfersOut === 'yes') parts.push(`Transfers to ${a.transfersOutCountry || 'abroad'}`);
      return parts.length ? parts.join(' · ') : 'No cash or foreign transfers';
    }
    case 'id':
      return [a.idType, a.addressDocType].filter(Boolean).join(' · ');
    case 'docs':
      return a.adviserFiles.length ? a.adviserFiles.map(friendlyFile).join(' · ') : 'No documents added';
    case 'consents': {
      const yn = (v: string) => (v === 'yes' ? 'yes' : 'no');
      return `Marketing: ${yn(a.marketing)} · Group: ${yn(a.groupConsent)}`;
    }
  }
}
