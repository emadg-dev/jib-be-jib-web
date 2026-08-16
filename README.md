<div align="center">

# 🎨 Jib-be-Jib Web

### Collaborative Trip Expense Tracker — Frontend

![React](https://img.shields.io/badge/React-19-61dafb?logo=react)
![Vite](https://img.shields.io/badge/Vite-7.x-purple?logo=vite)
![TanStack Query](https://img.shields.io/badge/TanStack-Query-v5-red)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)

</div>

---

<div align="center">

| [English](#english) | [فارسی](#persian) |
|:---:|:---:|

</div>

---

<div id="english">

## 🚀 Quick Start

```bash
npm install
npm run dev
```

Navigate to `http://localhost:3000`

---

## 📁 Project Structure

```
src/
├── main.tsx                 # Entry point
├── App.tsx                  # Routing, providers, auth guards
├── api/
│   ├── client.ts            # Axios instance + interceptors
│   └── services.ts          # All API functions + types
├── components/
│   ├── JalaliDatePicker.tsx  # Persian date picker
│   └── ui/core.tsx          # Card, Button, Input, Table, etc.
├── contexts/
│   ├── AuthContext.tsx       # Auth + permissions state
│   └── PreferencesContext.tsx # Language + theme
├── hooks/
│   └── usePermissions.ts    # Permission checking hook
├── layouts/
│   └── AppLayout.tsx         # App shell (sidebar, nav, dock)
├── pages/
│   ├── Dashboard.tsx         # Stats, charts, settlements
│   ├── Members.tsx           # Member management
│   ├── Deposits.tsx          # Deposit tracking
│   ├── Withdrawals.tsx       # Expense splitting
│   ├── Ratings.tsx           # Member ratings (4 tabs)
│   ├── Finance.tsx           # Deposits + Expenses + Settlements
│   ├── Settings.tsx          # Trip settings (4 tabs)
│   ├── Permissions.tsx       # Per-member permission overrides
│   ├── Roles.tsx             # Custom role management
│   ├── TripPicker.tsx        # Trip selection/creation
│   └── Profile.tsx           # Profile settings
└── utils/
    ├── format.ts             # Number formatting
    ├── jalaali.ts            # Jalali calendar
    └── translations.ts       # EN → FA translations
```

---

## 🛣️ Routes

| Route | Component | Access |
|-------|-----------|--------|
| `/login` | Login | Public |
| `/trips` | TripPicker | Authenticated |
| `/dashboard` | Dashboard | Authenticated |
| `/members` | Members | `member.*` permissions |
| `/finance` | Finance | Authenticated |
| `/ratings` | Ratings | Authenticated |
| `/settings` | Settings | Owner/Admin |
| `/profile` | Profile | Authenticated |

---

## 🔐 Permissions System

### Frontend Resolution

```tsx
const { hasPermission, canManagePermissions } = usePermissions();

hasPermission('deposit.create'); // → boolean
canManagePermissions;            // → boolean
```

### Pages Using Permissions

| Page | Checked Permissions |
|------|-------------------|
| Members | `member.create`, `member.update`, `member.delete` |
| Deposits | `deposit.create`, `deposit.update`, `deposit.delete` |
| Withdrawals | `withdrawal.create`, `withdrawal.update`, `withdrawal.delete` |
| Dashboard | `notifications.send` |
| TripPicker | `trip.create` |

---

## 🎨 UI Features

- **Responsive Design** — Mobile-first with icon-only tabs on small screens
- **Dark Mode** — Class-based theme switching
- **RTL Support** — Full Persian/Farsi language support
- **Jalali Dates** — Persian calendar integration
- **Glass Morphism** — Modern glass-panel UI components
- **Bottom Dock** — Mobile-optimized navigation

---

## 🚢 Deployment

```bash
npm run build
# Deploy dist/ to Cloudflare Pages
```

Dev server proxies `/api` → `http://localhost:8787`

---

Made with ❤️ by Emzi and MiMo

</div>

---

<div id="persian" dir="rtl">

## 🚀 شروع سریع

```bash
npm install
npm run dev
```

مرورگر را به `http://localhost:3000` باز کنید

---

## 📁 ساختار پروژه

```
src/
├── main.tsx                 # نقطه ورود
├── App.tsx                  # مسیردهی، Providerها، محافظ‌های احراز هویت
├── api/
│   ├── client.ts            # نمونه Axios + اینترسپتورها
│   └── services.ts          # تمام توابع API + تایپ‌ها
├── components/
│   ├── JalaliDatePicker.tsx  # انتخابگر تاریخ جلالی
│   └── ui/core.tsx          # Card, Button, Input, Table و غیره
├── contexts/
│   ├── AuthContext.tsx       # احراز هویت + state دسترسی‌ها
│   └── PreferencesContext.tsx # زبان + تم
├── hooks/
│   └── usePermissions.ts    # هوک بررسی دسترسی
├── layouts/
│   └── AppLayout.tsx         # پوسته برنامه (سایدبار، ناوبری، داک)
├── pages/
│   ├── Dashboard.tsx         # آمار، نمودارها، تسویه‌ها
│   ├── Members.tsx           # مدیریت اعضا
│   ├── Deposits.tsx          # ردیابی واریزها
│   ├── Withdrawals.tsx       # تقسیم هزینه‌ها
│   ├── Ratings.tsx           # ارزیابی اعضا (۴ تب)
│   ├── Finance.tsx           # واریزها + هزینه‌ها + تسویه‌ها
│   ├── Settings.tsx          # تنظیمات سفر (۴ تب)
│   ├── Permissions.tsx       # تغییرات دسترسی هر عضو
│   ├── Roles.tsx             # مدیریت نقش‌های سفارشی
│   ├── TripPicker.tsx        # انتخاب/ایجاد سفر
│   └── Profile.tsx           # تنظیمات پروفایل
└── utils/
    ├── format.ts             # فرمت اعداد
    ├── jalaali.ts            # تقویم جلالی
    └── translations.ts       # ترجمه انگلیسی به فارسی
```

---

## 🛣️ مسیرها

| مسیر | کامپوننت | دسترسی |
|------|----------|--------|
| `/login` | Login | عمومی |
| `/trips` | TripPicker | احراز هویت شده |
| `/dashboard` | Dashboard | احراز هویت شده |
| `/members` | Members | دسترسی‌های `member.*` |
| `/finance` | Finance | احراز هویت شده |
| `/ratings` | Ratings | احراز هویت شده |
| `/settings` | Settings | مالک/ادمین |
| `/profile` | Profile | احراز هویت شده |

---

## 🔐 سیستم دسترسی‌ها

### رزولوشن فرانت‌اند

```tsx
const { hasPermission, canManagePermissions } = usePermissions();

hasPermission('deposit.create'); // → boolean
canManagePermissions;            // → boolean
```

### صفحات استفاده‌کننده از دسترسی‌ها

| صفحه | دسترسی‌های بررسی شده |
|------|---------------------|
| اعضا | `member.create`, `member.update`, `member.delete` |
| واریزها | `deposit.create`, `deposit.update`, `deposit.delete` |
| هزینه‌ها | `withdrawal.create`, `withdrawal.update`, `withdrawal.delete` |
| داشبورد | `notifications.send` |
| انتخاب سفر | `trip.create` |

---

## 🎨 ویژگی‌های UI

- **طراحی واکنش‌گرا** — اول موبایل با تب‌های فقط آیکون در صفحه‌های کوچک
- **حالت تیره** — تغییر تم بر اساس کلاس
- **پشتیبانی RTL** — پشتیبانی کامل از زبان فارسی
- **تاریخ جلالی** — یکپارچه‌سازی تقویم جلالی
- **گلس مورفیسم** — کامپوننت‌های مدرن شیشه‌ای
- **داک پایین** — ناوبری بهینه شده برای موبایل

---

## 🚢 استقرار

```bash
npm run build
# پوشه dist/ را روی Cloudflare Pages مستقر کنید
```

سرور توسعه درخواست‌ها را به `http://localhost:8787` پروکسی می‌کند

---

با ❤️ ساخته شده توسط Emzi و MiMo

</div>
