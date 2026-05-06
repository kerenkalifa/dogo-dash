import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

export type Lang = 'en' | 'he';

type Dict = Record<string, { en: string; he: string }>;

const dict: Dict = {
  // Common
  back: { en: 'Back', he: 'חזרה' },
  save: { en: 'Save', he: 'שמור' },
  cancel: { en: 'Cancel', he: 'ביטול' },
  delete: { en: 'Delete', he: 'מחק' },
  confirm: { en: 'Confirm', he: 'אישור' },
  loading: { en: 'Loading...', he: 'טוען...' },
  yes: { en: 'Yes', he: 'כן' },
  no: { en: 'No', he: 'לא' },

  // Nav
  nav_home: { en: 'Home', he: 'בית' },
  nav_dogs: { en: 'Dogs', he: 'כלבים' },
  nav_stats: { en: 'Stats', he: 'נתונים' },
  nav_profile: { en: 'Profile', he: 'פרופיל' },

  // Home
  home_title: { en: 'Dogo 🐾', he: 'דוגו 🐾' },
  home_subtitle: { en: 'Ready to walk?', he: 'מוכנים לטיול?' },
  start_walk: { en: 'Start Walk', he: 'התחל טיול' },
  start_walk_hint: { en: 'Tap to begin tracking', he: 'הקש כדי להתחיל מעקב' },
  recent_walks: { en: 'Recent Walks', he: 'טיולים אחרונים' },
  no_walks: { en: 'No walks yet', he: 'אין טיולים עדיין' },
  no_walks_hint: { en: 'Start your first walk! 🏃', he: 'התחל את הטיול הראשון שלך! 🏃' },
  add_dog_first: { en: 'Add a dog first!', he: 'הוסף כלב קודם!' },
  add_dog_first_desc: { en: 'Go to the Dogs tab to add your pups.', he: 'עבור ללשונית הכלבים כדי להוסיף.' },
  pick_dog: { en: 'Pick at least one dog! 🐕', he: 'בחר לפחות כלב אחד! 🐕' },
  whos_walking: { en: "Who's walking? 🐕", he: 'מי בטיול? 🐕' },
  pick_dogs_desc: { en: 'Select the dogs joining this walk', he: 'בחר את הכלבים שמצטרפים לטיול' },
  lets_go: { en: "Let's Go!", he: 'יוצאים!' },
  selected: { en: 'selected', he: 'נבחרו' },
  walk_saved: { en: 'Walk saved! 🎉', he: 'הטיול נשמר! 🎉' },
  min_walk_logged: { en: 'min walk logged.', he: 'דקות נרשמו.' },
  unknown: { en: 'Unknown', he: 'לא ידוע' },
  delete_walk_q: { en: 'Delete this walk?', he: 'למחוק את הטיול הזה?' },
  delete_walk_desc: { en: 'This action cannot be undone.', he: 'לא ניתן לבטל פעולה זו.' },
  walk_deleted: { en: 'Walk deleted', he: 'הטיול נמחק' },

  // Walk Timer
  walk_in_progress: { en: 'Walk in Progress', he: 'טיול מתבצע' },
  stop_walk: { en: 'Stop Walk', he: 'עצור טיול' },

  // Dogs
  my_dogs: { en: 'My Dogs 🐕', he: 'הכלבים שלי 🐕' },
  no_dogs: { en: 'No dogs yet', he: 'אין כלבים עדיין' },
  add_first_pup: { en: 'Add your first pup!', he: 'הוסף את הכלב הראשון!' },
  add_dog: { en: 'Add Dog', he: 'הוסף כלב' },
  edit_dog: { en: 'Edit Dog', he: 'ערוך כלב' },
  dog_added: { en: 'Dog added! 🎉', he: 'כלב נוסף! 🎉' },
  dog_updated: { en: 'Dog updated! 🐾', he: 'הכלב עודכן! 🐾' },
  dog_removed: { en: 'Dog removed', he: 'הכלב הוסר' },
  name_required: { en: 'Name *', he: 'שם *' },
  breed_optional: { en: 'Breed (optional)', he: 'גזע (אופציונלי)' },
  image_url_optional: { en: 'Image URL (optional)', he: 'קישור לתמונה (אופציונלי)' },
  save_changes: { en: 'Save Changes', he: 'שמור שינויים' },
  edit_dog_desc: { en: "Update your dog's info", he: 'עדכן את פרטי הכלב' },
  add_dog_desc: { en: 'Tell us about your pup', he: 'ספר לנו על הכלב שלך' },

  // Manual Entry
  log_walk: { en: 'Log a Walk 📝', he: 'תיעוד טיול 📝' },
  walk_logged: { en: 'Walk logged! 📝', he: 'הטיול תועד! 📝' },
  dog_label: { en: 'Dog *', he: 'כלב *' },
  select_dog: { en: 'Select dog', he: 'בחר כלב' },
  date_label: { en: 'Date', he: 'תאריך' },
  start_time: { en: 'Start Time', he: 'שעת התחלה' },
  end_time: { en: 'End Time', he: 'שעת סיום' },
  notes_label: { en: 'Notes', he: 'הערות' },
  notes_placeholder: { en: 'How was the walk? Energetic? Calm?', he: 'איך היה הטיול? אנרגטי? רגוע?' },
  bathroom_q: { en: 'Bathroom Break? 💩', he: 'הפסקת שירותים? 💩' },
  save_walk: { en: 'Save Walk', he: 'שמור טיול' },

  // Stats
  stats_title: { en: 'Stats 📊', he: 'נתונים 📊' },
  share: { en: 'Share', he: 'שתף' },
  min_this_month: { en: 'MIN THIS MONTH', he: 'דק׳ החודש' },
  total_walks: { en: 'TOTAL WALKS', he: 'סה״כ טיולים' },
  breaks: { en: 'BREAKS', he: 'הפסקות' },
  minutes_last_7: { en: 'Minutes Walked (Last 7 Days)', he: 'דקות הליכה (7 ימים אחרונים)' },
  dog_stats: { en: 'Dog Stats', he: 'נתוני כלבים' },
  no_dog_stats: { en: 'No dogs to show stats for', he: 'אין כלבים להצגת נתונים' },
  walks_label: { en: 'WALKS', he: 'טיולים' },
  min_label: { en: 'MIN', he: 'דק׳' },
  monthly_summary: { en: 'Monthly Summary 📱', he: 'סיכום חודשי 📱' },
  monthly_summary_desc: { en: 'Screenshot and share with dog owners!', he: 'צלם מסך ושתף עם הבעלים!' },
  this_month_walks: { en: "This Month's Walks", he: 'הטיולים החודש' },
  summary: { en: 'Summary', he: 'סיכום' },
  minutes_word: { en: 'min', he: 'דק׳' },
  walks_word: { en: 'walks', he: 'טיולים' },
  generated_with: { en: 'Generated with Dogo 🐾', he: 'נוצר עם Dogo 🐾' },

  // Reports
  reports: { en: 'Reports', he: 'דוחות' },
  period: { en: 'Period', he: 'תקופה' },
  this_week: { en: 'This Week', he: 'השבוע' },
  this_month: { en: 'This Month', he: 'החודש' },
  this_quarter: { en: 'This Quarter', he: 'הרבעון' },
  this_year: { en: 'This Year', he: 'השנה' },
  custom_range: { en: 'Custom', he: 'מותאם' },
  from: { en: 'From', he: 'מתאריך' },
  to: { en: 'To', he: 'עד תאריך' },
  pick_start: { en: 'Pick start date', he: 'בחר תאריך התחלה' },
  pick_end: { en: 'Pick end date', he: 'בחר תאריך סיום' },
  export_csv: { en: 'Export CSV', he: 'ייצוא CSV' },
  export_pdf: { en: 'Export PDF', he: 'ייצוא PDF' },
  report_summary: { en: 'Report Summary', he: 'סיכום הדוח' },
  avg_walk: { en: 'Avg Walk', he: 'ממוצע טיול' },
  top_dog: { en: 'Top Dog', he: 'הכלב המוביל' },
  walks_in_range: { en: 'Walks in Range', he: 'טיולים בטווח' },
  per_dog_breakdown: { en: 'Per-Dog Breakdown', he: 'פירוט לפי כלב' },
  no_walks_range: { en: 'No walks in this range', he: 'אין טיולים בטווח זה' },
  dogo_walk_report: { en: 'Dogo Walk Report', he: 'דוח טיולים - Dogo' },
  pdf_summary: { en: 'Summary', he: 'סיכום' },
  pdf_per_dog_breakdown: { en: 'Per-Dog Breakdown', he: 'פירוט לפי כלב' },
  pdf_walks_section: { en: 'Walks', he: 'טיולים' },
  csv_date: { en: 'Date', he: 'תאריך' },
  csv_dog: { en: 'Dog', he: 'כלב' },
  csv_duration_min: { en: 'Duration (min)', he: 'משך (דקות)' },
  csv_bathroom_break: { en: 'Bathroom Break', he: 'הפסקת שירותים' },
  csv_notes: { en: 'Notes', he: 'הערות' },
  pdf_total_walks: { en: 'Total Walks', he: 'סה״כ טיולים' },
  pdf_total_minutes: { en: 'Total Minutes', he: 'סה״כ דקות' },
  pdf_bathroom_breaks: { en: 'Bathroom Breaks', he: 'הפסקות שירותים' },
  pdf_avg_walk_min: { en: 'Avg Walk (min)', he: 'ממוצע טיול (דק׳)' },
  pdf_top_dog: { en: 'Top Dog', he: 'הכלב המוביל' },
  pdf_minutes: { en: 'Minutes', he: 'דקות' },
  pdf_breaks: { en: 'Breaks', he: 'הפסקות' },
  pdf_break: { en: 'Break', he: 'הפסקה' },

  // Engagement
  high_energy: { en: '⚡ High Energy', he: '⚡ אנרגיה גבוהה' },
  chill_vibes: { en: '😌 Chill Vibes', he: '😌 רגוע' },
  happy_month: { en: '🎉 Happy Month', he: '🎉 חודש שמח' },
  steady_walker: { en: '🐾 Steady Walker', he: '🐾 הליכון יציב' },

  // Profile
  profile_title: { en: 'Profile 👤', he: 'פרופיל 👤' },
  dog_walker: { en: 'Dog Walker', he: 'מטייל כלבים' },
  sign_out: { en: 'Sign Out', he: 'התנתק' },
  walk_tracking_pros: { en: 'Walk tracking for pros', he: 'מעקב טיולים למקצוענים' },
  language: { en: 'Language', he: 'שפה' },
  english: { en: 'English', he: 'אנגלית' },
  hebrew: { en: 'Hebrew', he: 'עברית' },
  toggle_sidebar: { en: 'Toggle Sidebar', he: 'פתיחה/סגירה של סרגל צד' },
  pagination: { en: 'Pagination', he: 'דפדוף' },
  go_to_previous_page: { en: 'Go to previous page', he: 'עמוד קודם' },
  go_to_next_page: { en: 'Go to next page', he: 'עמוד הבא' },
  previous: { en: 'Previous', he: 'הקודם' },
  next: { en: 'Next', he: 'הבא' },
  more_pages: { en: 'More pages', he: 'עוד עמודים' },
  previous_slide: { en: 'Previous slide', he: 'שקופית קודמת' },
  next_slide: { en: 'Next slide', he: 'שקופית הבאה' },

  // Auth
  walk_tracking_pro_dogs: { en: 'Walk tracking for pros 🐕', he: 'מעקב טיולים למקצוענים 🐕' },
  email: { en: 'Email', he: 'אימייל' },
  password: { en: 'Password', he: 'סיסמה' },
  create_account: { en: 'Create Account', he: 'צור חשבון' },
  sign_in: { en: 'Sign In', he: 'התחבר' },
  account_created: { en: 'Account created! 🎉', he: 'החשבון נוצר! 🎉' },
  check_email: { en: 'Check your email to confirm.', he: 'בדוק את האימייל לאישור.' },
  oops: { en: 'Oops!', he: 'אופס!' },
  have_account: { en: 'Already have an account? Sign in', he: 'יש לך חשבון? התחבר' },
  no_account: { en: "Don't have an account? Sign up", he: 'אין לך חשבון? הירשם' },
  continue_with_google: { en: 'Continue with Google', he: 'המשך עם Google' },
  or: { en: 'or', he: 'או' },

  // Not found
  not_found_oops: { en: 'Oops! Page not found', he: 'אופס! העמוד לא נמצא' },
  return_home: { en: 'Return to Home', he: 'חזרה לדף הבית' },
};

interface LanguageContextType {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof dict) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [lang, setLangState] = useState<Lang>(() => {
    const stored = localStorage.getItem('dogo-lang');
    return (stored === 'he' || stored === 'en') ? stored : 'en';
  });

  const dir = lang === 'he' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
  }, [lang, dir]);

  const setLang = (l: Lang) => {
    setLangState(l);
    localStorage.setItem('dogo-lang', l);
  };

  const t = (key: keyof typeof dict) => dict[key]?.[lang] ?? String(key);

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
};
