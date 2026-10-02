import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, ChevronDown, Calendar as CalendarIcon, Phone } from 'lucide-react';
import apiClient from '../api/axiosConfig';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [leads, setLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Fetch leads to get follow-ups
  const fetchFollowUps = async () => {
    try {
      setIsLoading(true);
      // Fetching all active leads (or at least a large batch) to map follow-ups
      const res = await apiClient.get('/sales/leads', { params: { limit: 500 } });
      setLeads(res.data.leads || []);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load follow-up schedule');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFollowUps();
  }, []);

  // Calendar Math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay(); // 0-6 (Sun-Sat)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Generating grid arrays
  const prevMonthDays = Array.from({ length: firstDayOfMonth }, (_, i) => daysInPrevMonth - firstDayOfMonth + i + 1);
  const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  
  const totalCells = prevMonthDays.length + currentMonthDays.length;
  const nextMonthDaysCount = totalCells % 7 === 0 ? 0 : 7 - (totalCells % 7);
  const nextMonthDays = Array.from({ length: nextMonthDaysCount }, (_, i) => i + 1);

  // Navigation
  const goToPrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const goToNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  // Mapping Follow-ups to days
  const getEventsForDay = (day) => {
    const targetDateStr = new Date(year, month, day).toDateString();
    
    const dayLeads = leads.filter(l => {
      if (!l.nextFollowUpDate) return false;
      const followUpStr = new Date(l.nextFollowUpDate).toDateString();
      return followUpStr === targetDateStr;
    });

    return dayLeads;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-row justify-between items-start sm:items-center gap-2 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-1.5 sm:gap-2">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-[#0B3A2C] shrink-0" />
            <span className="hidden sm:inline">Follow-up Calendar</span>
            <span className="sm:hidden">Calendar</span>
          </h1>
          <p className="text-[11px] sm:text-sm text-gray-500 mt-1">Manage your upcoming calls and meetings</p>
        </div>

      </div>

      {/* Calendar Card */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Calendar Nav */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gray-50/30">
          <button onClick={goToPrevMonth} className="p-1.5 sm:p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors shadow-sm">
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
          <h2 className="text-lg sm:text-xl font-bold text-[#0B3A2C]">
            {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <button onClick={goToNextMonth} className="p-1.5 sm:p-2 border border-gray-200 hover:bg-gray-50 rounded-lg text-gray-500 transition-colors shadow-sm">
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="overflow-x-auto scrollbar-hide sm:scrollbar-default">
          <div className="min-w-[600px] sm:min-w-[800px]">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
              {daysOfWeek.map((day) => (
                <div key={day} className="py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider border-r border-gray-200 last:border-0">
                  {day}
                </div>
              ))}
            </div>

            {/* Dates Grid */}
            <div className="grid grid-cols-7 auto-rows-[minmax(140px,auto)]">
              {/* Prev month days */}
              {prevMonthDays.map(day => (
                <div key={`prev-${day}`} className="border-r border-b border-gray-200 p-3 text-gray-400 text-sm bg-gray-50/40 opacity-60">
                  {day}
                </div>
              ))}
              
              {/* Current month days */}
              {currentMonthDays.map(day => {
                const dayEvents = getEventsForDay(day);
                const isToday = new Date().toDateString() === new Date(year, month, day).toDateString();

                return (
                  <div key={`curr-${day}`} className={`border-r border-b border-gray-200 p-2 relative group transition-colors flex flex-col gap-1 ${isToday ? 'bg-emerald-50/30' : 'hover:bg-gray-50/50'}`}>
                    <div className="flex justify-between items-start mb-1">
                      <span className={`w-7 h-7 flex items-center justify-center rounded-full text-sm font-bold ${isToday ? 'bg-[#0B3A2C] text-white shadow-sm' : 'text-gray-700'}`}>
                        {day}
                      </span>
                      {dayEvents.length > 0 && (
                        <span className="text-[10px] font-bold text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded-full">
                          {dayEvents.length} calls
                        </span>
                      )}
                    </div>
                    
                    {/* Event Rendering */}
                    <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[100px] pr-1 custom-scrollbar">
                      {dayEvents.map(event => (
                        <div 
                          key={event._id}
                          onClick={() => navigate('/dashboard/my-leads')}
                          className="px-2 py-1.5 rounded-lg text-xs font-bold shadow-sm cursor-pointer hover:scale-[1.02] transition-transform bg-amber-50 text-amber-800 border border-amber-200 flex flex-col gap-0.5"
                          title={`Follow up: ${event.customerName}`}
                        >
                          <div className="flex items-center gap-1">
                            <Phone className="w-3 h-3 opacity-70" />
                            <span className="truncate">{event.customerName}</span>
                          </div>
                          <span className="text-[9px] font-semibold opacity-70 ml-4">
                            {new Date(event.nextFollowUpDate).toLocaleTimeString('en-GB', { hour: '2-digit', minute:'2-digit', hour12: true })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}

              {/* Next month days */}
              {nextMonthDays.map(day => (
                <div key={`next-${day}`} className="border-r border-b border-gray-200 p-3 text-gray-400 text-sm bg-gray-50/40 opacity-60 last:border-r-0">
                  {day}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e5e7eb; border-radius: 4px; }
      `}</style>
    </div>
  );
};

export default Calendar;
