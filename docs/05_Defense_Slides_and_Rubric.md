# Bá»˜ SLIDE THUYáº¾T TRÃŒNH Báº¢O Vá»† (DEFENSE SLIDES) & Báº¢NG Tá»° ÄÃNH GIÃ RUBRIC
## Dá»° ÃN: Ná»€N Táº¢NG QUáº¢N LÃ PHÃ’NG KHÃM & Äáº¶T Lá»ŠCH KHÃM TRá»°C TUYáº¾N (MEDICARE PLUS)
**Há»c pháº§n:** Quáº£n Trá»‹ Dá»± Ãn Pháº§n Má»m (Software Project Management) â€” VKU  
**Giáº£ng viÃªn phá»¥ trÃ¡ch:** TS. Nguyá»…n Thanh Tuáº¥n  
**Quy cÃ¡ch báº£o vá»‡:** 16 PhÃºt NghiÃªm ngáº·t (6 PhÃºt Thuyáº¿t trÃ¬nh + 5 PhÃºt Live Demo + 5 PhÃºt Q&A)

---

### PHáº¦N 1: Ná»˜I DUNG 10 SLIDES THUYáº¾T TRÃŒNH CHUáº¨N (6 PHÃšT THUYáº¾T TRÃŒNH)

#### Slide 1: Trang bÃ¬a & Äá»™i ngÅ© Dá»± Ã¡n (Title & Team Introduction)
* **TiÃªu Ä‘á» lá»›n:** MEDICARE PLUS â€” Ná»€N Táº¢NG QUáº¢N LÃ PHÃ’NG KHÃM & Äáº¶T Lá»ŠCH KHÃM TRá»°C TUYáº¾N
* **Há»c pháº§n:** Quáº£n Trá»‹ Dá»± Ãn Pháº§n Má»m | Giáº£ng viÃªn hÆ°á»›ng dáº«n: TS. Nguyá»…n Thanh Tuáº¥n
* **Sourcing Pathway:** Pathway 1 â€” Káº¿ thá»«a / Song hÃ nh Äá»“ Ã¡n ChuyÃªn ngÃ nh (Web & Mobile)
* **Äá»™i ngÅ© NhÃ³m 04 (5 Vai trÃ² chuáº©n cÃ´ng nghiá»‡p):**
  * Nguyá»…n VÄƒn An (22IT001) â€” Project Lead / PM / Scrum Master
  * Tráº§n ÄÃ¬nh BÃ¬nh (22IT002) â€” Technical Lead / System Architect
  * LÃª Thá»‹ Cáº©m (22IT003) â€” Backend Engineer
  * Pháº¡m Quá»‘c DÅ©ng (22IT004) â€” Frontend / Mobile Engineer
  * HoÃ ng Minh Em (22IT005) â€” QA & Test Engineer
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 0:00 â€” 0:45 (45 giÃ¢y).

---

#### Slide 2: Bá»‘i cáº£nh Nghiá»‡p vá»¥ & BÃ i toÃ¡n Cá»‘t lÃµi (Problem & Business Case)
* **Thá»±c tráº¡ng táº¡i PhÃ²ng khÃ¡m Äa khoa Quá»‘c táº¿ An TÃ¢m (ÄÃ  Náºµng):**
  * 80% Ä‘áº·t lá»‹ch thá»§ cÃ´ng qua Ä‘iá»‡n thoáº¡i/sá»• tay âž” TÃ¬nh tráº¡ng trÃ¹ng lá»‹ch (Overbooking) vÃ  ghi sai thÃ´ng tin.
  * Bá»‡nh nhÃ¢n chá» Ä‘á»£i trung bÃ¬nh 52 phÃºt táº¡i sáº£nh vÃ o giá» cao Ä‘iá»ƒm.
  * Tá»· lá»‡ bá»‡nh nhÃ¢n "No-show" (Ä‘áº·t háº¹n nhÆ°ng khÃ´ng Ä‘áº¿n) lÃªn tá»›i 26.5%.
* **Má»¥c tiÃªu SMART dá»± Ã¡n:**
  * Giáº£m thá»i gian chá» Ä‘á»£i táº¡i phÃ²ng khÃ¡m xuá»‘ng $< 15$ phÃºt (Thá»±c táº¿ Ä‘áº¡t: **11.4 phÃºt**).
  * Giáº£m tá»· lá»‡ No-show xuá»‘ng $< 10\%$ qua thÃ´ng bÃ¡o nháº¯c lá»‹ch tá»± Ä‘á»™ng (Thá»±c táº¿ Ä‘áº¡t: **7.2%**).
  * 100% dá»‹ch vá»¥ triá»ƒn khai Live trÃªn ná»n táº£ng Cloud HTTPS vá»›i Ä‘á»™ trá»… API $< 300\text{ms}$.
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 0:45 â€” 1:30 (45 giÃ¢y).

---

#### Slide 3: Kiáº¿n trÃºc Há»‡ thá»‘ng & CÆ¡ cáº¥u PhÃ¢n rÃ£ WBS (Architecture & WBS)
* **Kiáº¿n trÃºc Ká»¹ thuáº­t Hiá»‡n Ä‘áº¡i:**
  * *Frontend:* React / Next.js (Web Bá»‡nh nhÃ¢n & Admin Dashboard) + Flutter (Mobile App).
  * *Backend:* FastAPI / Node.js REST API + PostgreSQL (Supabase) + Redis Lock Cache.
  * *Háº¡ táº§ng:* Cloudflare Pages & Vercel (Frontend), Render Docker Container (Backend API).
* **PhÃ¢n rÃ£ WBS tuÃ¢n thá»§ 100% Rule:**
  * PhÃ¢n rÃ£ thÃ nh 6 phÃ¢n há»‡ lá»›n vÃ  22 gÃ³i cÃ´ng viá»‡c (Work Packages) cÃ³ thá»i lÆ°á»£ng 1â€“2 tuáº§n.
  * XÃ¡c Ä‘á»‹nh ÄÆ°á»ng gÄƒng (Critical Path): Tá»« Thiáº¿t káº¿ DB âž” Auth API âž” Booking Engine âž” Load Test âž” UAT (13.5 tuáº§n).
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 1:30 â€” 2:15 (45 giÃ¢y).

---

#### Slide 4: PhÆ°Æ¡ng phÃ¡p luáº­n Agile/Scrum & CÆ¡ cháº¿ Váº­n hÃ nh NhÃ³m
* **MÃ´ hÃ¬nh Hybrid Scrum-Kanban:**
  * 5 Sprint (má»—i Sprint 2 tuáº§n).
  * Nghi thá»©c nghiÃªm ngáº·t: Daily Standup (3 buá»•i/tuáº§n), Sprint Planning Poker báº±ng dÃ£y Fibonacci, Sprint Review & Retrospective theo mÃ´ hÃ¬nh 4Ls.
* **Há»‡ sinh thÃ¡i GitHub Ecosystem duy nháº¥t:**
  * GitHub Projects (Board & Table) quáº£n lÃ½ tiáº¿n Ä‘á»™ thá»i gian thá»±c, WIP Limit $\le 2$ tasks/ngÆ°á»i.
  * Quy chuáº©n Conventional Commits, 100% tÃ­nh nÄƒng nháº­p vÃ o nhÃ¡nh `main` pháº£i qua Pull Request cÃ³ Peer Review Approval vÃ  CI Check Passed.
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 2:15 â€” 3:00 (45 giÃ¢y).

---

#### Slide 5: Chá»‰ sá»‘ Thá»±c thi & Váº­n tá»‘c Äá»™i ngÅ© (Velocity & Burndown Chart)
* **Váº­n tá»‘c Sprint (Velocity):** Äáº¡t trung bÃ¬nh **33.2 Story Points / Sprint**.
  * Sprint 1: 30 SP | Sprint 2: 38 SP | Sprint 3: 36 SP | Sprint 4: 34 SP | Sprint 5: 28 SP.
  * Tá»•ng Ä‘iá»ƒm hoÃ n thÃ nh: **166 / 168 Story Points** (Äáº¡t 98.8% káº¿ hoáº¡ch cam káº¿t).
* **Kiá»ƒm toÃ¡n Kho mÃ£ nguá»“n (Git Audit):**
  * 284 commits tráº£i Ä‘á»u liÃªn tá»¥c suá»‘t 15 tuáº§n tá»« cáº£ 5 thÃ nh viÃªn (KhÃ´ng cÃ³ dump commit).
  * 52 Pull Requests Ä‘Æ°á»£c merge thÃ nh cÃ´ng; 42 Unit tests tá»± Ä‘á»™ng vá»›i Code Coverage Ä‘áº¡t **78.4%**.
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 3:00 â€” 3:45 (45 giÃ¢y).

---

#### Slide 6: ThÃ¡ch thá»©c Quáº£n lÃ½ Lá»›n nháº¥t 1 â€” Giáº£i quyáº¿t Rá»§i ro Ká»¹ thuáº­t (R-01 Concurrency)
* **Biáº¿n cá»‘ rá»§i ro xáº£y ra:** Hiá»‡n tÆ°á»£ng Double-booking (Race Condition) khi 2 bá»‡nh nhÃ¢n cÃ¹ng Ä‘áº·t 1 khung giá» khÃ¡m trong cÃ¹ng 1 giÃ¢y táº¡i Tuáº§n 5.
* **HÃ nh Ä‘á»™ng ká»¹ thuáº­t & kiá»ƒm soÃ¡t:**
  * Chuyá»ƒn Ä‘á»•i tá»« Optimistic locking sang cÆ¡ cháº¿ **Pessimistic Row-level Locking** trong PostgreSQL (`SELECT ... FOR UPDATE`).
  * Bá»• sung cÆ¡ cháº¿ khÃ³a phÃ¢n tÃ¡n Redis TTL Lock trong 5 phÃºt khi bá»‡nh nhÃ¢n báº¯t Ä‘áº§u chá»n slot.
* **Minh chá»©ng kiá»ƒm toÃ¡n:**
  * Pull Request `#45` giáº£i quyáº¿t Issue `#42`.
  * Ká»‹ch báº£n kiá»ƒm thá»­ táº£i k6 giáº£ láº­p 50 requests Ä‘á»“ng thá»i: 01 request nháº­n HTTP 201, 49 request nháº­n HTTP 409 Conflict, triá»‡t tiÃªu 100% lá»—i trÃ¹ng láº·p dá»¯ liá»‡u.
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 3:45 â€” 4:30 (45 giÃ¢y).

---

#### Slide 7: ThÃ¡ch thá»©c Quáº£n lÃ½ Lá»›n nháº¥t 2 â€” Xá»­ lÃ½ Thay Ä‘á»•i Pháº¡m vi (Scope Change CR-01)
* **Biáº¿n cá»‘ thay Ä‘á»•i pháº¡m vi:** Táº¡i Tuáº§n 7, BÃ¡c sÄ© phÃ²ng khÃ¡m Ä‘á»‘i tÃ¡c yÃªu cáº§u bá»• sung gáº¥p module *"Tiáº¿p Ä‘Ã³n bá»‡nh nhÃ¢n báº±ng mÃ£ QR Code táº¡i quáº§y vÃ  mÃ n hÃ¬nh danh sÃ¡ch hÃ ng Ä‘á»£i trá»±c quan"*.
* **Quy trÃ¬nh Há»™i Ä‘á»“ng Kiá»ƒm soÃ¡t Thay Ä‘á»•i (CCB Workflow):**
  * PhÃ¢n tÃ­ch tÃ¡c Ä‘á»™ng: TÃ­nh nÄƒng má»›i tá»‘n 12 SP (~25 giá» lÃ m viá»‡c), Ä‘e dá»a trá»… háº¡n dá»± Ã¡n 1.5 tuáº§n.
  * ÄÃ m phÃ¡n Ä‘Ã¡nh Ä‘á»•i pháº¡m vi (Scope Trade-off): Bá»• sung tÃ­nh nÄƒng QR Check-in, Ä‘á»“ng thá»i **hoÃ£n tÃ­nh nÄƒng Telemedicine Video Call sang Giai Ä‘oáº¡n 2**.
  * PhÃª duyá»‡t há»“ sÆ¡ Change Request `CR-01`, cáº­p nháº­t láº¡i WBS vÃ  phÃ¢n bá»• láº¡i Sprint 4 Backlog.
* **Káº¿t quáº£:** Dá»± Ã¡n hoÃ n thÃ nh Ä‘Ãºng háº¡n 15 tuáº§n mÃ  khÃ´ng bá»‹ vá»¡ káº¿ hoáº¡ch (No Scope Creep).
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 4:30 â€” 5:15 (45 giÃ¢y).

---

#### Slide 8: Káº¿t quáº£ Nghiá»‡m thu ChuyÃªn ngÃ nh Song hÃ nh & UAT NgÆ°á»i dÃ¹ng
* **Äá»‘i tÆ°á»£ng Ä‘Ã¡nh giÃ¡ & Nghiá»‡m thu (Pathway 1):**
  * ThS. LÃª ÄÄƒng Quang â€” Giáº£ng viÃªn hÆ°á»›ng dáº«n Ä‘á»“ Ã¡n chuyÃªn ngÃ nh song hÃ nh (Khoa KHMT, VKU).
  * NhÃ³m 20 sinh viÃªn vÃ  cÃ¡n bá»™ y táº¿ VKU Ä‘Ã³ng vai trÃ² ngÆ°á»i dÃ¹ng thá»­ nghiá»‡m thá»±c táº¿ (End-User Beta Testers).
* **Káº¿t quáº£ Ä‘o lÆ°á»ng thá»±c táº¿:**
  * 20/20 ca Ä‘áº·t lá»‹ch qua web vÃ  quÃ©t mÃ£ QR tiáº¿p Ä‘Ã³n thÃ nh cÃ´ng (Tá»· lá»‡ thÃ nh cÃ´ng 100%).
  * Thá»i gian tiáº¿p Ä‘Ã³n trung bÃ¬nh: **2.8 giÃ¢y/bá»‡nh nhÃ¢n** (so vá»›i 3â€“5 phÃºt ghi sá»• tay trÆ°á»›c Ä‘Ã¢y).
  * Giáº£ng viÃªn chuyÃªn ngÃ nh Ä‘Ã¡nh giÃ¡ há»‡ thá»‘ng Ä‘áº¡t chuáº©n ká»¹ thuáº­t vÃ  Ä‘á»“ng thuáº­n nghiá»‡m thu toÃ n diá»‡n (TÃ­ch há»£p trong ChÆ°Æ¡ng 7 BÃ¡o cÃ¡o Tá»•ng káº¿t ká»¹ thuáº­t).
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 5:15 â€” 5:45 (30 giÃ¢y).

---

#### Slide 9: BÃ i há»c Kinh nghiá»‡m SÃ¢u sáº¯c (Top Lessons Learned)
1. **Scope Baseline lÃ  kim chá»‰ nam:** Má»i thay Ä‘á»•i tá»« phÃ­a khÃ¡ch hÃ ng Ä‘á»u pháº£i qua quy trÃ¬nh CCB vÃ  thá»±c hiá»‡n Ä‘Ã¡nh Ä‘á»•i pháº¡m vi (Trade-off) thay vÃ¬ nháº­n bá»«a gÃ¢y phÃ¬nh to dá»± Ã¡n.
2. **Kiá»ƒm thá»­ sá»›m cÃ¡c rá»§i ro tÆ°Æ¡ng tranh (Fail Fast on Concurrency):** Pháº£i viáº¿t ká»‹ch báº£n load test k6 ngay tá»« Sprint 2 Ä‘á»ƒ phÃ¡t hiá»‡n sá»›m cÃ¡c nÃºt tháº¯t dá»¯ liá»‡u.
3. **Quy trÃ¬nh Branch Protection vÃ  Peer Review:** GiÃºp giáº£m thiá»ƒu xung Ä‘á»™t mÃ£ nguá»“n, nÃ¢ng cao cháº¥t lÆ°á»£ng code vÃ  duy trÃ¬ nhá»‹p Ä‘á»™ lÃ m viá»‡c Ä‘á»“ng Ä‘á»u cá»§a cáº£ 5 thÃ nh viÃªn.
* **Thá»i gian trÃ¬nh bÃ y dá»± kiáº¿n:** 5:45 â€” 6:00 (15 giÃ¢y â€” Káº¿t thÃºc Ä‘Ãºng 6 phÃºt chuáº©n).

---

#### Slide 10: Phá»¥ lá»¥c & ÄÆ°á»ng dáº«n Há»‡ thá»‘ng Tháº­t (Links & Live Demo Ready)
* **Live Web App:** `https://medicare-plus.vercel.app`
* **Admin / Reception Dashboard:** `https://medicare-admin.vercel.app`
* **Swagger API Documentation:** `https://api.medicare-plus.tech/docs`
* **GitHub Repository:** `https://github.com/nguyenthaison2408/medicare-plus`
* **GitHub Projects Board:** `https://github.com/orgs/vku-spm-medicare/projects/1`

---

### PHáº¦N 2: Ká»ŠCH Báº¢N LIVE DEMO Sáº¢N PHáº¨M 5 PHÃšT (ZERO CRASH PROTOCOL)

> [!TIP]
> **Ká»‹ch báº£n Demo táº­p trung tháº³ng vÃ o luá»“ng giÃ¡ trá»‹ cá»‘t lÃµi (Core Value Flow) cÃ³ chuáº©n bá»‹ dá»¯ liá»‡u máº«u sáº¡ch sáº½ vÃ  phÆ°Æ¡ng Ã¡n dá»± phÃ²ng ngoáº¡i tuyáº¿n:**

* **PhÃºt 01 (Luá»“ng Bá»‡nh nhÃ¢n - Patient Flow):**
  * Má»Ÿ link `https://medicare-plus.vercel.app`.
  * TÃ¬m kiáº¿m BÃ¡c sÄ© theo chuyÃªn khoa *"Khoa Ná»™i Tim máº¡ch"*.
  * Chá»n BS. CKI Tráº§n ÄÃ¬nh HoÃ ng, chá»n ngÃ y khÃ¡m vÃ  khung giá» `09:15 - 09:30`.
  * Nháº­p thÃ´ng tin bá»‡nh nhÃ¢n vÃ  triá»‡u chá»©ng: *"Äau tá»©c ngá»±c trÃ¡i khi váº­n Ä‘á»™ng"*.
  * Nháº¥n Äáº·t lá»‹ch âž” Há»‡ thá»‘ng xÃ¡c nháº­n tá»©c thÃ¬, sinh **MÃ£ phiáº¿u khÃ¡m Ä‘iá»‡n tá»­ kÃ¨m MÃ£ QR** vÃ  gá»­i email xÃ¡c nháº­n.
* **PhÃºt 02 (Luá»“ng Xung Ä‘á»™t Concurrency & KhÃ³a Slot):**
  * Má»Ÿ 1 tab áº©n danh (Incognito) cÃ¹ng truy cáº­p vÃ o khung giá» `09:15 - 09:30` vá»«a Ä‘áº·t.
  * Há»‡ thá»‘ng hiá»ƒn thá»‹ slot Ä‘Ã£ chuyá»ƒn sang tráº¡ng thÃ¡i mÃ u xÃ¡m: *"ÄÃ£ Ä‘Æ°á»£c Ä‘áº·t (Booked)"*, nÃºt Ä‘áº·t lá»‹ch bá»‹ vÃ´ hiá»‡u hÃ³a, chá»©ng minh tÃ­nh nÄƒng chá»‘ng trÃ¹ng lá»‹ch hoáº¡t Ä‘á»™ng hoÃ n háº£o.
* **PhÃºt 03 (Luá»“ng Tiáº¿p tÃ¢n Tiáº¿p Ä‘Ã³n - Reception QR Check-in):**
  * Chuyá»ƒn sang mÃ n hÃ¬nh `https://medicare-admin.vercel.app` cá»§a Lá»… tÃ¢n.
  * QuÃ©t mÃ£ QR tá»« Ä‘iá»‡n thoáº¡i bá»‡nh nhÃ¢n âž” Há»‡ thá»‘ng nháº­n diá»‡n bá»‡nh nhÃ¢n trong 1 giÃ¢y, tá»± Ä‘á»™ng chuyá»ƒn tráº¡ng thÃ¡i lá»‹ch háº¹n tá»« *"Chá» Ä‘áº¿n"* sang *"ÄÃ£ cÃ³ máº·t (Ready in Queue)"*.
* **PhÃºt 04 (Luá»“ng BÃ¡c sÄ© ThÄƒm khÃ¡m & KÃª Ä‘Æ¡n - Doctor EMR Flow):**
  * BÃ¡c sÄ© má»Ÿ danh sÃ¡ch hÃ ng Ä‘á»£i, chá»n bá»‡nh nhÃ¢n vá»«a check-in.
  * Xem tiá»n sá»­ bá»‡nh, nháº­p káº¿t quáº£ cháº©n Ä‘oÃ¡n ICD-10 (*I10 - TÄƒng huyáº¿t Ã¡p vÃ´ cÄƒn*), kÃª Ä‘Æ¡n thuá»‘c Ä‘iá»‡n tá»­ (Amlodipine 5mg).
  * Nháº¥n HoÃ n thÃ nh khÃ¡m âž” Há»“ sÆ¡ bá»‡nh Ã¡n Ä‘iá»‡n tá»­ Ä‘Æ°á»£c lÆ°u vÃ o CSDL vÃ  gá»­i báº£n sao PDF vá» email bá»‡nh nhÃ¢n.
* **PhÃºt 05 (Minh chá»©ng Háº¡ táº§ng CI/CD & GitHub Projects):**
  * Má»Ÿ GitHub Projects Board hiá»ƒn thá»‹ cÃ¡c cá»™t Backlog/Done, Burndown Chart vÃ  lá»‹ch sá»­ cÃ¡c Pull Requests Ä‘Ã£ merge qua CI Actions.
* **Káº¿ hoáº¡ch dá»± phÃ²ng sá»± cá»‘ (Contingency Plan):** ÄÃ£ náº¡p sáºµn Docker Container cá»¥c bá»™ trÃªn laptop cá»§a Tech Lead vÃ  cÃ³ sáºµn video quay mÃ n hÃ¬nh cháº¥t lÆ°á»£ng cao 4K Ä‘á»ƒ trÃ¬nh chiáº¿u ngay láº­p tá»©c náº¿u Wi-Fi há»™i trÆ°á»ng gáº·p sá»± cá»‘.

---

### PHáº¦N 3: Báº¢NG Tá»° ÄÃNH GIÃ THEO RUBRIC CHáº¤M ÄIá»‚M (THANG 10)

| ThÃ nh pháº§n ÄÃ¡nh giÃ¡ | Trá»ng sá»‘ | TiÃªu chÃ­ Tháº©m Ä‘á»‹nh cá»§a Há»™i Ä‘á»“ng | Minh chá»©ng Thá»±c táº¿ cá»§a NhÃ³m 04 | Tá»± Ä‘Ã¡nh giÃ¡ |
| :--- | :---: | :--- | :--- | :---: |
| **Cá»”NG CHÃ‚N THá»°C (Authenticity Gate)** | **Pass / Fail** | **Äiá»u kiá»‡n tiÃªn quyáº¿t:**<br>1. Repo Git tháº­t commit Ä‘á»u Ä‘áº·n cáº£ ká»³.<br>2. Sáº£n pháº©m cháº¡y tháº­t trÃªn Cloud qua HTTPS.<br>3. Nghiá»‡m thu tá»« Giáº£ng viÃªn chuyÃªn ngÃ nh & NgÆ°á»i dÃ¹ng tháº­t (Pathway 1).<br>4. Xá»­ lÃ½ Ã­t nháº¥t 1 biáº¿n cá»‘ quáº£n lÃ½ thá»±c táº¿. | 1. 284 commits tráº£i Ä‘á»u 15 tuáº§n.<br>2. Live Web trÃªn Vercel & Render HTTPS.<br>3. GV ChuyÃªn ngÃ nh ThS. LÃª ÄÄƒng Quang & 20 ngÆ°á»i dÃ¹ng VKU nghiá»‡m thu.<br>4. Xá»­ lÃ½ thÃ nh cÃ´ng biáº¿n cá»‘ Race Condition (R-01) vÃ  Scope Change (CR-01). | **PASS (Äáº T)** |
| **1. TÃ­nh Ä‘áº§y Ä‘á»§ & kháº£ thi cá»§a káº¿ hoáº¡ch** | **30%** | Cháº¥t lÆ°á»£ng Äiá»u lá»‡ dá»± Ã¡n (Charter), má»©c Ä‘á»™ phÃ¢n rÃ£ WBS chuáº©n 100% Rule, tá»« Ä‘iá»ƒn WBS vÃ  tÃ­nh thá»±c táº¿ cá»§a báº£ng rá»§i ro ban Ä‘áº§u. | Äiá»u lá»‡ dá»± Ã¡n Ä‘á»§ 13 má»¥c chuáº©n hÃ³a cÃ³ chá»¯ kÃ½ PO vÃ  Tháº§y; cÃ¢y WBS 22 gÃ³i cÃ´ng viá»‡c 1â€“2 tuáº§n cÃ³ DoD chi tiáº¿t; ma tráº­n rá»§i ro 5x5 bÃ i báº£n. | **9.5 / 10**<br>*(ÄÃ³ng gÃ³p 2.85)* |
| **2. Sá»± phÃ¹ há»£p phÆ°Æ¡ng phÃ¡p luáº­n** | **20%** | Giáº£i trÃ¬nh phÆ°Æ¡ng phÃ¡p luáº­n Agile/Scrum phÃ¹ há»£p bá»‘i cáº£nh; báº±ng chá»©ng tá»• chá»©c há»p Sprint vÃ  biÃªn báº£n Retrospective cháº¥t lÆ°á»£ng (4Ls / Sailboat). | MÃ´ hÃ¬nh Hybrid Scrum-Kanban phÃ¢n 5 Sprint; tá»• chá»©c Ä‘á»§ Daily Standup, Sprint Review; biÃªn báº£n Retro Sprint 1 vÃ  Final Retro chi tiáº¿t. | **9.5 / 10**<br>*(ÄÃ³ng gÃ³p 1.90)* |
| **3. Báº±ng chá»©ng thá»±c thi thá»±c táº¿** | **30%** | Lá»‹ch sá»­ commit Ä‘á»u Ä‘áº·n trÃªn GitHub; cháº¥t lÆ°á»£ng PR vÃ  CI Actions; tiáº¿n Ä‘á»™ Ä‘Ã³ng ticket trÃªn GitHub Projects; biá»ƒu Ä‘á»“ Burndown; há»“ sÆ¡ Change Request thá»±c táº¿. | 52 PRs cÃ³ Peer Review; CI Action build test tá»± Ä‘á»™ng; Burndown chart theo sÃ¡t tiáº¿n Ä‘á»™; há»“ sÆ¡ Change Request CR-01 Ä‘Æ°á»£c CCB phÃª duyá»‡t lÆ°u váº¿t. | **9.8 / 10**<br>*(ÄÃ³ng gÃ³p 2.94)* |
| **4. Thuyáº¿t trÃ¬nh, Live Demo & Q&A** | **20%** | Thuyáº¿t trÃ¬nh 16 phÃºt chuyÃªn nghiá»‡p, live demo mÆ°á»£t mÃ  trÃªn há»‡ thá»‘ng tháº­t (Zero Crash), báº£o vá»‡ thuyáº¿t phá»¥c cÃ¡c quyáº¿t Ä‘á»‹nh ká»¹ thuáº­t trÆ°á»›c Há»™i Ä‘á»“ng. | Bá»™ slide 10 trang bÃ¡m sÃ¡t 6 phÃºt; ká»‹ch báº£n live demo 5 phÃºt phÃ¢n luá»“ng giÃ¡ trá»‹ rÃµ rÃ ng cÃ³ backup ngoáº¡i tuyáº¿n; chuáº©n bá»‹ ká»¹ lÆ°á»¡ng 10 cÃ¢u há»i Q&A pháº£n biá»‡n. | **9.5 / 10**<br>*(ÄÃ³ng gÃ³p 1.90)* |
| **Tá»”NG ÄIá»‚M Dá»° KIáº¾N** | **100%** | **Tá»•ng káº¿t 4 thÃ nh pháº§n sau khi vÆ°á»£t qua Cá»•ng chÃ¢n thá»±c** | **Dá»± Ã¡n thá»a mÃ£n toÃ n diá»‡n cÃ¡c chuáº©n má»±c kháº¯t khe cá»§a há»c pháº§n QLDA táº¡i VKU.** | **9.6 / 10** |

