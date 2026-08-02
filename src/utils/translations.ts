const errorTranslations: Record<string, string> = {
  // Auth errors
  // 'Invalid credentials': 'نام کاربری یا رمز عبور اشتباه است',
  'User not found': 'کاربر یافت نشد',
  'Unauthorized': 'دسترسی غیرمجاز',
  'Token expired': 'جلسه منقضی شده است',
  'Account locked': 'حساب کاربری قفل شده است',

  // Profile errors
  'Current password is incorrect': 'رمز عبور فعلی اشتباه است',
  'Password updated': 'رمز عبور با موفقیت تغییر کرد',
  'Error changing password': 'خطا در تغییر رمز عبور',

  // Trip errors
  'Trip not found': 'سفر یافت نشد',
  'Trip name is required': 'نام سفر الزامی است',

  // Member errors
  'Member not found': 'عضو یافت نشد',
  'Member already exists': 'عضو از قبل وجود دارد',
  'Cannot delete owner': 'امکان حذف مدیر وجود ندارد',

  // Deposit errors
  'Deposit not found': 'واریز یافت نشد',
  'Amount must be positive': 'مبلغ باید مثبت باشد',

  // Withdrawal errors
  'Withdrawal not found': 'هزینه یافت نشد',
  'Description is required': 'توضیحات الزامی است',
  'Sum of shares must equal total amount': 'مجموع سهم‌ها باید برابر با مبلغ کل باشد',

  // General errors
  'Not found': 'یافت نشد',
  'Bad request': 'درخواست نامعتبر',
  'Internal server error': 'خطای داخلی سرور',
  'Something went wrong': 'مشکلی پیش آمد',
  'Network error': 'خطای شبکه',
};

export function translateError(message: string, isFa: boolean): string {
  if (!isFa) return message;
  return errorTranslations[message] || message;
}
