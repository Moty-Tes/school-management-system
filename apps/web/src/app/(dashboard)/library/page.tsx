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
    setIsBookModalOpen(false);
    setBookData({ title: '', author: '', isbn: '', category: 'General', totalCopies: 1 });
    loadData();
  }

  async function handleIssueBook(e: FormEvent) {
    e.preventDefault();
    try {
      await api.post('/api/v1/library/issue', issueData);
      setIsIssueModalOpen(false);
      loadData();
      alert('Book issued successfully!');
    } catch (err: any) {
      alert(err.message); // "No copies available"
    }
  }

  async function handleReturnBook(loanId: string) {
    if (!window.confirm("Mark this book as returned?")) return;
    try {
      const res = await api.patch<{ fine: number }>(`/api/v1/library/return/${loanId}`);
      alert(res.fine > 0 ? `Book returned. Late fine applied: ${res.fine} ETB` : 'Book returned on time.');
      loadData();
    } catch (err) {
      alert('Failed to return book');
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Library</h1>
          <p className="text-slate-500 text-sm mt-1">Manage books and student loans</p>
        </div>
        <button 
          onClick={() => activeTab === 'catalog' ? setIsBookModalOpen(true) : setIsIssueModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
        >
          {activeTab === 'catalog' ? '+ Add Book' : '📖 Issue Book'}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b">
        <button onClick={() => setActiveTab('catalog')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'catalog' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Book Catalog</button>
        <button onClick={() => setActiveTab('loans')} className={`pb-2 px-2 text-sm font-medium ${activeTab === 'loans' ? 'border-b-2 border-indigo-600 text-indigo-600' : 'text-slate-500'}`}>Active Loans</button>
      </div>

      {/* CATALOG TAB */}
      {activeTab === 'catalog' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Title</th>
                <th className="py-3 px-4">Author</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Available</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {books.map(b => (
                <tr key={b.id} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-medium text-slate-900">{b.title}</td>
                  <td className="py-3 px-4">{b.author}</td>
                  <td className="py-3 px-4"><span className="bg-slate-100 text-slate-600 px-2 py-1 rounded text-xs">{b.category}</span></td>
                  <td className="py-3 px-4 font-bold text-emerald-600">{b.availableCopies} / {b.totalCopies}</td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => { setIssueData({ ...issueData, bookId: b.id }); setIsIssueModalOpen(true); }} className="text-indigo-600 font-semibold text-xs hover:underline">Issue</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* LOANS TAB */}
      {activeTab === 'loans' && (
        <div className="bg-white border rounded-xl overflow-hidden shadow-sm">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 border-b text-xs font-semibold text-slate-500 uppercase">
              <tr>
                <th className="py-3 px-4">Book</th>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Due Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loans.map(l => {
                const isOverdue = new Date(l.dueDate) < new Date();
                return (
                  <tr key={l.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium text-slate-900">{l.book.title}</td>
                    <td className="py-3 px-4">{l.student.firstName} {l.student.lastName}</td>
                    <td className="py-3 px-4 font-mono">
                      <span className={isOverdue ? 'text-red-600 font-bold' : 'text-slate-600'}>
                        {new Date(l.dueDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleReturnBook(l.id)} className="bg-slate-900 text-white px-3 py-1 rounded text-xs font-semibold hover:bg-slate-800">Return</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* ADD BOOK MODAL */}
      {isBookModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Add New Book</h2>
            <form onSubmit={handleAddBook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Title</label>
                <input required type="text" value={bookData.title} onChange={e => setBookData({...bookData, title: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Author</label>
                <input required type="text" value={bookData.author} onChange={e => setBookData({...bookData, author: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium mb-1">Category</label>
                  <input required type="text" value={bookData.category} onChange={e => setBookData({...bookData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Copies</label>
                  <input required type="number" min="1" value={bookData.totalCopies} onChange={e => setBookData({...bookData, totalCopies: Number(e.target.value)})} className="w-full px-3 py-2 border rounded-lg text-sm" />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsBookModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ISSUE BOOK MODAL */}
      {isIssueModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-sm p-6">
            <h2 className="text-xl font-bold mb-4">Issue Book</h2>
            <form onSubmit={handleIssueBook} className="space-y-4">
              <div>
                <label className="block text-xs font-medium mb-1">Book</label>
                <select value={issueData.bookId} onChange={e => setIssueData({...issueData, bookId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {books.filter(b => b.availableCopies > 0).map(b => <option key={b.id} value={b.id}>{b.title} ({b.availableCopies} left)</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Student</label>
                <select value={issueData.studentId} onChange={e => setIssueData({...issueData, studentId: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm">
                  {students.map(s => <option key={s.id} value={s.id}>{s.firstName} {s.lastName}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">Due Date</label>
                <input required type="date" value={issueData.dueDate} onChange={e => setIssueData({...issueData, dueDate: e.target.value})} className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => setIsIssueModalOpen(false)} className="px-4 py-2 text-sm">Cancel</button>
                <button type="submit" className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm">Issue</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}