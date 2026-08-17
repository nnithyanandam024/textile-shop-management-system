import React, { useState } from 'react';
import { Card } from '../../../components/ui/Card';
import { Button } from '../../../components/ui/Button';
import { CreditCard, Lock, Unlock, Edit2, ShieldCheck } from 'lucide-react';

interface BankTabProps {
  bankDetails: any;
  onEdit: () => void;
  onRefreshBank: (reveal: boolean) => void;
}

export const BankTab: React.FC<BankTabProps> = ({
  bankDetails,
  onEdit,
  onRefreshBank,
}) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const handleToggleReveal = () => {
    const nextState = !isRevealed;
    setIsRevealed(nextState);
    onRefreshBank(nextState);
  };

  return (
    <Card className="space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-[#2818cf]">
            <CreditCard className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Bank & Payroll Payout Setup</h3>
            <p className="text-xs text-slate-500">Sensitive bank account, IFSC & payment method preferences</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {bankDetails && (
            <Button
              variant="outline"
              icon={isRevealed ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
              onClick={handleToggleReveal}
            >
              {isRevealed ? 'Mask Account' : 'Reveal Full Account'}
            </Button>
          )}
          <Button variant="outline" icon={<Edit2 className="w-3.5 h-3.5" />} onClick={onEdit}>
            {bankDetails ? 'Edit Bank Details' : 'Configure Bank Setup'}
          </Button>
        </div>
      </div>

      {!bankDetails ? (
        <div className="text-center py-12 text-slate-400 text-xs font-medium">
          No bank details configured for this staff member. Click "Configure Bank Setup" to add payout info.
        </div>
      ) : (
        <div className="space-y-6">
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs font-semibold text-amber-800 flex items-center gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <p className="font-bold">Sensitive Financial Setup</p>
              <p className="text-[11px] text-amber-700">
                Bank information is masked by default (`••••••••1234`) and excluded from public reports/exports to protect staff data integrity.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 text-xs font-semibold text-slate-700">
            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px]">Bank Name</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{bankDetails.bank_name}</p>
            </div>

            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px]">Account Holder Name</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{bankDetails.account_holder_name}</p>
            </div>

            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px]">Account Number</p>
              <p className="text-sm font-extrabold text-[#2818cf] font-mono mt-1">
                {bankDetails.account_number_encrypted}
              </p>
            </div>

            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px]">IFSC Code</p>
              <p className="text-sm font-bold text-slate-900 font-mono mt-1">{bankDetails.ifsc}</p>
            </div>

            <div>
              <p className="text-slate-400 uppercase tracking-wider text-[10px]">Preferred Payment Method</p>
              <p className="text-sm font-bold text-slate-900 mt-1">{bankDetails.payment_method}</p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};
