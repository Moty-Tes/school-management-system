'use client';

import { useEffect, useState, FormEvent } from 'react';
import { api } from '@/lib/api';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'loans'>('catalog');
  const [books, setBooks] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);

  // Modals
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [isIssueModalOpen, setIsIssueModalOpen] = useState(false);

  // Forms
  const [bookData, setBookData] = useState({ title: '', author: '', isbn: '', category: 'General', totalCopies: 1 });
  const [issueData, setIssueData] = useState({ bookId: '', studentId: '', dueDate: '' });

  async function loadData() {
    const [booksData, loansData, studentsData] = await Promise.all([
      api.get<any[]>('/api/v1/library/books'),
      api.get<any[]>('/api/v1/library/loans'),
      api.get<any[]>('/api/v1/students')
    ]);
    setBooks(booksData);
    setLoans(loansData);
    setStudents(studentsData);

    if (booksData.length > 0) setIssueData(prev => ({...prev, bookId: booksData[0].id}));
    if (studentsData.length > 0) setIssueData(prev => ({...prev, studentId: studentsData[0].id}));
  }

  useEffect(() => { loadData(); }, []);

  async function handleAddBook(e: FormEvent) {
    e.preventDefault();
    await api.post('/api/v1/library/books', { ...bookData, totalCopies: Number(bookData.totalCopies) });
    showSuccessToast('Book added successfully!');
    setIsBookModalOpen(false);
    setBookData({ title: '', author: '', isbn: '', category: 'General', totalCopies: 1 });
    loadData();
  }

  async function handleIssueBook(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/library/issue', issueData);
      showSuccessToast('Book issued successfully!');
      setIsIssueModalOpen(false);
      loadData();
      alert('Book issued successfully!');
    } catch (err: any) {
      showErrorToast(err.message || 'No copies available');
      alert(err.message || 'No copies available');
    }
  }

  async function handleReturnBook(loanId: string) {
    if (!window.confirm("Mark this book as returned?")) return;
    try {
      const res = await api.patch<{ fine: number }>(`/api/v1/library/return/${loanId}`);
      showSuccessToast(res.fine > 0 ? `Book returned. Late fine applied: ${res.fine} ETB` : 'Book returned on time.');
      loadData();
    } catch (err) {
      showErrorToast('Failed to return book');
      alert('Failed to return book');
    }
  }

  // --- Toast & Feedback System ---
  function showSuccessToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.querySelector('div')!.className = 'bg-emerald-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-emerald-500/20 transform translate-y-0 transition-transform duration-500 ease-out';
    }, 10);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  function showErrorToast(message: string) {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed top-4 right-4 z-50 space-y-3';
    toastContainer.innerHTML = `
      <div className="bg-red-600 text-white px-6 py-4 rounded-3xl shadow-2xl shadow-red-500/20 transform translate-y-0 transition-transform duration-500 ease-out">
        <svg className="w-5 h-5 -mr-2 inline-block" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116 21H8a2 2 0 01-2-1.858L5 7"></path></svg>
        <span>${message}</span>
      </div>
    `;
    document.body.appendChild(toastContainer);

    setTimeout(() => {
      toastContainer.style.transform = 'translateY(-100%)';
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  }

  return (
    <motion.div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 300, delay: 0.1 }}
        className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Library</h1>
          <p className="text-slate-500 text-sm mt-1">Manage books and student loans</p>
        </div>

        <motion.button
          onClick={() => setActiveTab('catalog') ? setIsBookModalOpen(true) : setIsIssueModalOpen(true)}
          className="bg-primary-600 hover:bg-primary-700 text-white px-5 py-3 rounded-lg text-sm font-medium transition-all duration-300 shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 flex items-center gap-2"
        >
          {activeTab === 'catalog' ? '+ Add Book' : '📖 Issue Book'}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
          </svg>
        </motion.button>
      </motion.div>

      {/* Tabs */}
      <motion.div className="flex gap-4 border-b">
        <motion.button
          onClick={() => setActiveTab('catalog')}
          className={`pb-2 px-2 text-sm font-medium ${
            activeTab === 'catalog'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-500'
          } transition-colors`}
        >
          Book Catalog
        </motion.button>
        <motion.button
          onClick={() => setActiveTab('loans')}
          className={`pb-2 px-2 text-sm font-medium ${
            activeTab === 'loans'
              ? 'border-b-2 border-primary-600 text-primary-600'
              : 'text-slate-500'
          } transition-colors`}
        >
          Active Loans
        </motion.button>
      </motion.div>

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
        <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-50/30">
          <motion.div className="animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
            <motion.table className="w-full text-left">
              <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <motion.tr>
                  <motion.th className="py-3 px-4">Title</motion.th>
                  <motion.th className="py-3 px-4">Author</motion.th>
                  <motion.th className="py-3 px-4">Category</motion.th>
                  <motion.th className="py-3 px-4">Available</motion.th>
                  <motion.th className="py-3 px-4 text-right">Actions</motion.th>
                </motion.tr>
              </motion.thead>
              <motion.tbody className="divide-y divide-slate-100 text-sm">
                {books.map(b => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                    className="hover:bg-slate-50"
                  >
                    <motion.td className="py-3 px-4 font-medium text-slate-900">{b.title}</motion.td>
                    <motion.td className="py-3 px-4">{b.author}</motion.td>
                    <motion.td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{b.category}</span></motion.td>
                    <motion.td className="py-3 px-4 font-bold text-emerald-600">{b.availableCopies} / {b.totalCopies}</motion.td>
                    <motion.td className="py-3 px-4 text-right">
                      <motion.button
                        onClick={() => { setIssueData({ ...issueData, bookId: b.id }); setIsIssueModalOpen(true); }}
                        className="text-primary-600 font-semibold text-xs hover:underline transition-colors"
                      >
                        Issue
                      </motion.button>
                    </motion.td>
                  </motion.tr>
                ))}
              </motion.tbody>
            </motion.table>
          </motion.div>
        </motion.div>

        {/* LOANS TAB */}
      )}{activeTab === 'loans' && (
        <motion.div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-lg shadow-slate-50/30">
          <motion.div className="animate-in" style={{ transitionProperty: 'all', transitionDuration: '0.2s' }}>
            <motion.table className="w-full text-left">
              <motion.thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase">
                <motion.tr>
                  <motion.th className="py-3 px-4">Book</motion.th>
                  <motion.th className="py-3 px-4">Student</motion.th>
                  <motion.th className="py-3 px-4">Due Date</motion.th>
                  <motion.th className="py-3 px-4 text-right">Actions</motion.th>
                </motion.tr>
              </motion.thead>
              <motion.tbody className="divide-y divide-slate-100 text-sm">
                {loans.map(l => {
                  const isOverdue = new Date(l.dueDate) < new Date();
                  return (
                    <motion.tr
                      key={l.id}
                      initial={{ opacity: 0, y: -20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: "spring", stiffness: 300, delay: Math.random() * 0.1 }}
                      className="hover:bg-slate-50"
                    >
                      <motion.td className="py-3 px-4 font-medium text-slate-900">{l.book.title}</motion.td>
                      <motion.td className="py-3 px-4">{l.student.firstName} {l.student.lastName}</motion.td>
                      <motion.td className="py-3 px-4 font-mono">
                        <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                          {new Date(l.dueDate).toLocaleDateString()}
                        </span>
                      </motion.td>
                      <motion.td className="py-3 px-4 text-right">
                        <motion.button
                          onClick={() => handleReturnBook(l.id)}
                          className="bg-slate-900 text-white px-4 py-2 rounded text-xs font-semibold hover:bg-slate-800 transition-colors"
                        >
                          Return
                        </motion.button>
                      </motion.td>
                    </motion.tr>
                  )
                })}
              </motion.tbody>
            </motion.table>
          </motion.div>
        </motion.div>
      )}

      {/* ADD BOOK MODAL */}
      {isBookModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-sm p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
              </svg>
              Add New Book
            </h2>

            <form onSubmit={handleAddBook} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Title</label>
                <input
                  required
                  type="text"
                  value={bookData.title}
                  onChange={(e) => setBookData({...bookData, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="The Great Gatsby"
                />
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Author</label>
                <input
                  required
                  type="text"
                  value={bookData.author}
                  onChange={(e) => setBookData({...bookData, author: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  placeholder="F. Scott Fitzgerald"
                />
              </motion.div>

              <motion.div className="grid grid-cols-2 gap-4">
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
                  <input
                    required
                    type="text"
                    value={bookData.category}
                    onChange={(e) => setBookData({...bookData, category: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </motion.div>
                <motion.div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Total Copies</label>
                  <input
                    required
                    type="number"
                    min="1"
                    value={bookData.totalCopies}
                    onChange={(e) => setBookData({...bookData, totalCopies: Number(e.target.value)})}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                  />
                </motion.div>
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsBookModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
                >
                  Add Book
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}

      {/* ISSUE BOOK MODAL */}
      {isIssueModalOpen && (
        <motion.div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
          whileHover={{ opacity: 0.9 }}
        >
          <motion.div
            className="bg-white rounded-3xl shadow-3xl w-full max-w-sm p-8 shadow-3xl"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <svg className="w-5 h-5 text-primary-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m6 4h12m0 0l-4 4m4-4l-4-4m0-6H4"></path>
              </svg>
              Issue Book
            </h2>

            <form onSubmit={handleIssueBook} className="space-y-5">
              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Book</label>
                <select
                  value={issueData.bookId}
                  onChange={(e) => setIssueData({...issueData, bookId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                >
                  {books.filter(b => b.availableCopies > 0).map(b => (
                    <option key={b.id} value={b.id}>
                      {b.title} ({b.availableCopies} left)
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Student</label>
                <select
                  value={issueData.studentId}
                  onChange={(e) => setIssueData({...issueData, studentId: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 appearance-none bg-white pl-4 pr-12 cursor-pointer"
                >
                  {students.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.firstName} {s.lastName}
                    </option>
                  ))}
                </select>
              </motion.div>

              <motion.div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Due Date</label>
                <input
                  required
                  type="date"
                  value={issueData.dueDate}
                  onChange={(e) => setIssueData({...issueData, dueDate: e.target.value})}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </motion.div>

              <motion.div className="flex justify-end gap-3 pt-6 border-t">
                <motion.button
                  type="button"
                  onClick={() => setIsIssueModalOpen(false)}
                  className="px-5 py-3 text-sm font-medium text-slate-600 hover:text-slate-900 transition-all duration-300"
                >
                  Cancel
                </motion.button>
                <motion.button
                  type="submit"
                  className="px-5 py-3 text-sm font-medium bg-primary-600 text-white rounded-xl transition-all"
                >
                  Issue Book
                </motion.button>
              </motion.div>
            </form>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}