# Parcela Admin Dashboard

لوحة تحكم إدارية كاملة لمنصة Parcela للتجارة الإلكترونية — جزر الرأس الأخضر.

---

## البدء السريع

```bash
cd admin-dashboard
npm install
cp .env.example .env     # عدّل VITE_API_URL إذا لزم
npm run dev              # http://localhost:5173
```

للإنتاج:
```bash
npm run build
npm run preview
```

---

## بنية المجلدات

```
src/
├── api/          # client.js (Axios+JWT refresh) + وحدة لكل مورد
├── components/   # Sidebar, Navbar, DataTable, Modal, FormControls
├── context/      # AuthContext (RBAC: admin/vendor فقط)
├── layouts/      # DashboardLayout
├── lib/          # alerts.js, exportUtils.js, queryClient.js
└── pages/        # auth, Dashboard, users, products, categories,
                  # islands, orders, coupons, reviews, banners, security
```

---

## الصفحات والميزات

| الصفحة | الميزات |
|--------|---------|
| Dashboard | KPI cards + Line/Bar charts (Recharts) + آخر الطلبات |
| Users | بحث + فلترة الدور + إضافة + حظر/رفع + تفاصيل+3تبويبات |
| Products | CRUD كامل + رفع 8 صور + مواصفات + جزر التوصيل |
| Categories | هرمية (رئيسي/فرعي) + أيقونة + sortOrder |
| Islands | رسوم التوصيل CVE + أيام ETA |
| Orders | بحث + فلترة الحالة + تحديث الحالة + رقم التتبع |
| Coupons | 3 أنواع + تاريخ انتهاء + حد استخدام |
| Reviews | نشر/إخفاء + فلترة بالتقييم |
| Banners | رفع صورة + استهداف جزيرة + جدولة |
| Security | OTP Abuse Monitor + رفع حظر + Broadcast Notification |

كل الجداول تدعم **تصدير Excel و PDF**.

---

## متغيرات البيئة

```env
VITE_API_URL=http://localhost:5000/api
```

---

## التغييرات على الباكند

### Endpoints جديدة (`/api/admin/`)
- `GET /dashboard/stats|charts|recent`
- `GET|POST /users`, `GET|PUT|DELETE /users/:id`
- `PATCH /users/:id/status|role`, `PUT /users/:id/password`
- `GET /users/:id/orders|addresses`
- `POST /notifications/broadcast`
- `GET /security/otp-logs`, `PATCH /security/otp-logs/:id/unblock`

### إضافات على مسارات موجودة
- `GET /products/admin/all`
- `GET /categories/admin/all`
- `GET /reviews/admin/all`, `PATCH /reviews/:id/moderate`

### إصلاحات الباكند
- Global Rate Limiter (1000 req/15min)
- `deliveredAt` field مضاف لـ Order schema
- `parseMultipartJson` middleware لمعالجة الحقول المتداخلة في multipart/form-data
- بحث في الطلبات برقم الطلب أو العميل
- بحث وفلترة في الكوبونات
