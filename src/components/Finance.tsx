import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Wallet, CreditCard, History, Clock, CheckCircle2, AlertCircle, Download, X } from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../redux/store';
import { fetchInvoices, payInvoice } from '../redux/slices/invoiceSlice';
import { Invoice } from '../types';

export default function Finance() {
  const dispatch = useDispatch<AppDispatch>();
  const { invoices, isLoading } = useSelector((state: RootState) => state.invoices);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    dispatch(fetchInvoices());
  }, [dispatch]);

  const unpaidTotal = invoices
    .filter(inv => inv.status === 'Unpaid')
    .reduce((sum, inv) => sum + inv.amount, 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const handlePayment = async () => {
    if (!selectedInvoice) return;

    setIsProcessing(true);
    const resultAction = await dispatch(payInvoice(selectedInvoice.id));
    setIsProcessing(false);

    if (payInvoice.fulfilled.match(resultAction)) {
      setSelectedInvoice(null);
      alert('Thanh toán thành công!');
    } else {
      alert('Thanh toán thất bại: ' + resultAction.payload);
    }
  };

  return (
    <div className="space-y-6">
      {/* Payment Modal */}
      {selectedInvoice && createPortal(
        <div className="fixed inset-0 bg-black/50 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-primary p-6 text-white flex justify-between items-start">
              <div>
                <h3 className="text-lg font-bold">Xác nhận thanh toán</h3>
                <p className="text-blue-100 text-sm mt-1">Vui lòng kiểm tra thông tin trước khi thanh toán</p>
              </div>
              <button 
                onClick={() => setSelectedInvoice(null)}
                className="text-white/70 hover:text-white transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Mã hóa đơn</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.id}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Nội dung</span>
                  <span className="font-bold text-slate-800 text-right max-w-[200px]">{selectedInvoice.title}</span>
                </div>
                <div className="flex justify-between items-center py-3 border-b border-slate-100">
                  <span className="text-slate-500 text-sm">Hạn thanh toán</span>
                  <span className="font-bold text-slate-800">{selectedInvoice.dueDate}</span>
                </div>
                <div className="flex justify-between items-center py-3">
                  <span className="text-slate-500 text-sm">Số tiền</span>
                  <span className="font-bold text-primary text-xl">{formatCurrency(selectedInvoice.amount)}</span>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-6 bg-slate-200 rounded flex items-center justify-center">
                    <div className="w-6 h-4 bg-red-500/20 rounded-sm"></div>
                  </div>
                  <span className="font-medium text-slate-700">Ví điện tử (Mô phỏng)</span>
                </div>
                <p className="text-xs text-slate-500">
                  Đây là chức năng mô phỏng. Không có tiền thật bị trừ.
                </p>
              </div>

              <button 
                onClick={handlePayment}
                disabled={isProcessing}
                className="w-full bg-primary text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Đang xử lý...
                  </>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Xác nhận thanh toán {formatCurrency(selectedInvoice.amount)}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Học phí & Tài chính</h1>
          <p className="text-slate-500">Quản lý các khoản phí và lịch sử thanh toán</p>
        </div>
        <button 
          onClick={() => {
            const firstUnpaid = invoices.find(i => i.status === 'Unpaid');
            if (firstUnpaid) setSelectedInvoice(firstUnpaid);
            else alert('Bạn không có khoản nợ nào cần thanh toán!');
          }}
          className="btn-primary flex items-center gap-2"
        >
          <CreditCard size={18} />
          Thanh toán trực tuyến
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="lg:col-span-3 py-12 text-center text-slate-500">
            <div className="flex justify-center items-center gap-2">
              <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              Đang tải dữ liệu...
            </div>
          </div>
        ) : (
          <>
            {/* Summary Card */}
            <div className="lg:col-span-1 space-y-6">
          <div className="card p-6 bg-primary text-white border-none relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-xs font-bold uppercase tracking-widest opacity-80 mb-2">Tổng công nợ hiện tại</p>
              <h2 className="text-3xl font-bold mb-6">{formatCurrency(unpaidTotal)}</h2>
              <div className="flex items-center gap-2 text-sm bg-white/10 p-3 rounded-lg border border-white/20">
                <AlertCircle size={18} className="text-amber-300" />
                <span>Bạn có {invoices.filter(i => i.status === 'Unpaid').length} khoản chưa thanh toán</span>
              </div>
            </div>
            <div className="absolute -right-8 -bottom-8 opacity-10">
              <Wallet size={160} />
            </div>
          </div>

          <div className="card p-6">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Clock size={18} className="text-primary" />
              Lưu ý thanh toán
            </h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                <p className="text-sm text-slate-600">Học phí phải được thanh toán trước ngày 15 của tháng bắt đầu học kỳ.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                <p className="text-sm text-slate-600">Sinh viên nợ học phí quá hạn sẽ bị khóa tài khoản đăng ký môn học.</p>
              </div>
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></div>
                <p className="text-sm text-slate-600">Mọi thắc mắc vui lòng liên hệ Phòng Kế hoạch - Tài chính.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="card overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2">
                <History size={18} className="text-primary" />
                Lịch sử hóa đơn
              </h3>
              <button className="text-xs font-bold text-primary hover:underline">Xem tất cả</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="text-xs font-bold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                    <th className="px-6 py-4">Nội dung</th>
                    <th className="px-6 py-4">Số tiền</th>
                    <th className="px-6 py-4">Hạn thanh toán</th>
                    <th className="px-6 py-4">Trạng thái</th>
                    <th className="px-6 py-4"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                        Không có dữ liệu hóa đơn
                      </td>
                    </tr>
                  ) : invoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="font-bold text-slate-800 text-sm">{inv.title}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-medium">ID: {inv.id}</p>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-700 text-sm">{formatCurrency(inv.amount)}</td>
                      <td className="px-6 py-4 text-sm text-slate-500">{inv.dueDate}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          inv.status === 'Paid' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {inv.status === 'Paid' ? <CheckCircle2 size={12} /> : <AlertCircle size={12} />}
                          {inv.status === 'Paid' ? 'Đã nộp' : 'Chưa nộp'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status === 'Unpaid' ? (
                          <button 
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-1.5 bg-primary text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                          >
                            Thanh toán
                          </button>
                        ) : (
                          <button className="p-2 text-slate-400 hover:text-primary hover:bg-slate-100 rounded-lg transition-all">
                            <Download size={18} />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        </>
      )}
      </div>
    </div>
  );
}
