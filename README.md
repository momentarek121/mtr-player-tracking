# نظام تتبع اللاعبين وقياس التطور — MTR Team

نظام كامل لإدارة لاعبي الجوجيتسو والـ MMA: بيانات اللاعب، الحضور، التقييم الفني/البدني/التكتيكي/الذهني، نتائج البطولات، ونظام توصيات آلي (Roadmap Engine) بيحدد نقاط الضعف ويقترح خطة تطوير.

## البنية

```
prisma/
  schema.prisma      كل الجداول (اللاعبين، الحصص، الحضور، التقييمات، التستات البدنية، البطولات، قواعد التوصيات)
  seed.ts             بيانات ابتدائية: تصنيفات المهارات + قواعد توصيات جاهزة لـ BJJ و MMA
lib/
  roadmap-engine.ts   المحرك اللي بيحلل آخر تقييم لكل مهارة ويولّد خطة تطوير + منحنى التقدم + نسبة الحضور
app/api/players/
  route.ts                          GET (list) / POST (create) لاعب
  [id]/assessments/route.ts         تسجيل تقييم مهارة جديد (بيشغّل الـ roadmap engine تلقائي بعدها)
  [id]/analytics/route.ts           كل بيانات الـ dashboard: تريند التقدم + حضور + تستات بدنية + سجل بطولات
  [id]/roadmap/route.ts             عرض/تحديث خطة التطوير الحالية
```

## أهم فكرة في التصميم: فصل المحاور

كل مهارة مربوطة بـ `domain` واحد من أربعة:

| Domain | أمثلة |
|---|---|
| TECHNICAL | Closed Guard, Submissions, Striking, Takedowns |
| TACTICAL | Game Plan Execution, Cage/Mat Awareness |
| PHYSICAL | Conditioning, Strength, Flexibility |
| MENTAL | Composure Under Pressure, Coachability |

ده بيخلي أي رسم بياني أو تقرير يقدر يقارن تطور اللاعب في كل ناحية لوحدها بدل ما تتلخبط في رقم واحد عام مش بيقول حاجة.

## آلية الـ Roadmap Engine (التوصيات الآلية)

1. الكوتش بيسجل تقييم دوري (1-10) لكل مهارة عن طريق `POST /api/players/:id/assessments`.
2. المحرك بياخد آخر درجة لكل مهارة، ويقارنها بجدول `RoadmapRule` (مثلاً: لو "Takedown Defense" أقل من 5 → يطلع توصية "زوّد تدريب الدفاع على التيك داون").
3. أي نقطة ضعف تتحول لـ `PlayerRoadmapItem` بحالة OPEN، مرتبة بالأولوية.
4. لو اللاعب اتحسن في نفس المهارة، النقطة تتقفل تلقائيًا (RESOLVED).

القواعد الجاهزة في `seed.ts` نقطة بداية بس — تقدر تضيف قواعد أكتر من لوحة تحكم الأدمن بعدين من غير ما تلمس الكود.

## التشغيل

```bash
npm install
npx prisma migrate dev --name init
npx tsx prisma/seed.ts
npm run dev
```

لازم `DATABASE_URL` في `.env` (مثال SQLite):
```
DATABASE_URL="file:./dev.db"
```

## خطوات لسه محتاجة تتعمل (مش شغالة كـ mock)

- ربط `getServerSession()` بنظام الـ auth الفعلي عندك (next-auth أو أي حل تاني) وتفعيل فحص الصلاحيات (role) اللي متسيب placeholder في `players/route.ts`.
- شاشات الـ UI (نماذج إدخال اللاعب، صفحة البروفايل بالرسوم البيانية عبر Recharts، لوحة تحكم القواعد).
- منطق حساب العمر/فئة الوزن لو هتستخدمها في تصنيف البطولات.
