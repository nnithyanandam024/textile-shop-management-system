import React from 'react';
import { StaffInventoryTaskItem, StaffPOReceivingItem } from '../../services/staffInventoryService';
import { CheckSquare, Clock, ArrowRight, PackageCheck } from 'lucide-react';

interface InventoryTasksProps {
  tasks: StaffInventoryTaskItem[];
  poReceivingList: StaffPOReceivingItem[];
  onOpenReceiving: (po: StaffPOReceivingItem) => void;
  onOpenCount: () => void;
  onOpenTransfer: () => void;
}

export const InventoryTasks: React.FC<InventoryTasksProps> = ({
  tasks,
  poReceivingList,
  onOpenReceiving,
  onOpenCount,
  onOpenTransfer,
}) => {
  const hasTasks = tasks.length > 0 || poReceivingList.length > 0;

  return (
    <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/80 shadow-sm space-y-4 select-none">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-[#2818cf] flex items-center justify-center font-bold">
            <CheckSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 tracking-tight">
              Assigned Inventory Operations & Tasks
            </h3>
            <p className="text-[11px] font-semibold text-slate-500">
              Assigned physical stock verification, purchase receiving, and store transfers
            </p>
          </div>
        </div>

        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-indigo-50 text-[#2818cf]">
          {tasks.filter((t) => t.status === 'PENDING').length + poReceivingList.length} Active Tasks
        </span>
      </div>

      {/* Task Cards Grid */}
      {!hasTasks ? (
        <div className="p-8 text-center bg-slate-50/60 rounded-2xl border border-dashed border-slate-200">
          <CheckSquare className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
          <p className="text-xs font-bold text-slate-600">All inventory tasks are currently up to date.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          {/* 1. Pending Purchase Orders for Stock Receiving */}
          {poReceivingList.map((po) => (
            <div
              key={`po-${po.id}`}
              className="p-4 bg-purple-50/40 border border-purple-100 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-purple-100 text-purple-800">
                    Stock Inward Receiving
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 font-mono">PO: {po.purchaseNumber}</span>
                </div>
                <h4 className="font-extrabold text-slate-900 text-sm">{po.supplierName}</h4>
                <p className="text-[11px] text-slate-500 font-semibold">
                  {po.items.length} product lines to inspect and verify quantities
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-purple-100/60">
                <span className="text-[10px] font-bold text-purple-700">Awaiting Physical Check</span>
                <button
                  type="button"
                  onClick={() => onOpenReceiving(po)}
                  className="px-3 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Receive PO</span>
                </button>
              </div>
            </div>
          ))}

          {/* 2. Direct Assigned Inventory Tasks */}
          {tasks.map((task) => (
            <div
              key={task.id}
              className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-col justify-between space-y-3"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold ${
                      task.taskType === 'STOCK_COUNT'
                        ? 'bg-indigo-100 text-indigo-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {task.taskType === 'STOCK_COUNT' ? 'Physical Stock Count' : 'Stock Movement'}
                  </span>
                  {task.dueDate && (
                    <span className="text-[10px] font-bold text-amber-700 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>Due: {task.dueDate}</span>
                    </span>
                  )}
                </div>

                <h4 className="font-extrabold text-slate-900 text-sm">{task.title}</h4>
                {task.description && (
                  <p className="text-[11px] text-slate-500 font-semibold">{task.description}</p>
                )}
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                <span className="text-[10px] font-bold text-slate-400">Status: {task.status}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (task.taskType === 'STOCK_COUNT') onOpenCount();
                    else onOpenTransfer();
                  }}
                  className="px-3 py-1.5 bg-[#2818cf] hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1"
                >
                  <span>Start Task</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
