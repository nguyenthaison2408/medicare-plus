# BÃO CÃO Tá»”NG Káº¾T Ká»¸ THUáº¬T Dá»° ÃN (FINAL TECHNICAL REPORT)
## Dá»° ÃN: Ná»€N Táº¢NG QUáº¢N LÃ PHÃ’NG KHÃM & Äáº¶T Lá»ŠCH KHÃM TRá»°C TUYáº¾N (MEDICARE PLUS)
**Há»c pháº§n:** Quáº£n Trá»‹ Dá»± Ãn Pháº§n Má»m (Software Project Management)  
**ÄÆ¡n vá»‹ Ä‘Ã o táº¡o:** Khoa Khoa há»c MÃ¡y tÃ­nh â€” TrÆ°á»ng Äáº¡i há»c CÃ´ng nghá»‡ ThÃ´ng tin & Truyá»n thÃ´ng Viá»‡t - HÃ n (VKU)  
**Giáº£ng viÃªn phá»¥ trÃ¡ch:** TS. Nguyá»…n Thanh Tuáº¥n  
**Lá»›p há»c pháº§n:** Quáº£n trá»‹ dá»± Ã¡n pháº§n má»m (4)  
**NhÃ³m thá»±c hiá»‡n:** NhÃ³m 04 (5 ThÃ nh viÃªn)  
**Thá»i gian thá»±c hiá»‡n:** ThÃ¡ng 09/2026 â€” ThÃ¡ng 12/2026 (15 tuáº§n)  
**PhiÃªn báº£n tÃ i liá»‡u:** v1.0 (Audit-Ready Final Report)

---

> [!IMPORTANT]
> **TUÃ‚N THá»¦ NGUYÃŠN Táº®C VÄ‚N PHONG Há»’ SÆ  KIá»‚M TOÃN Lá»ŠCH Sá»¬:**
> ToÃ n bá»™ bÃ¡o cÃ¡o nÃ y Ä‘Æ°á»£c biÃªn soáº¡n 100% á»Ÿ **THÃŒ QUÃ KHá»¨ (PAST TENSE)**, pháº£n Ã¡nh trung thá»±c toÃ n bá»™ quÃ¡ trÃ¬nh thá»±c thi, dá»¯ liá»‡u kiá»ƒm toÃ¡n Git, chá»‰ sá»‘ váº­n tá»‘c Sprint vÃ  cÃ¡c sá»± kiá»‡n quáº£n lÃ½ dá»± Ã¡n Ä‘Ã£ diá»…n ra trong suá»‘t 15 tuáº§n há»c ká»³.

---

## CHÆ¯Æ NG 1: Tá»”NG QUAN Dá»° ÃN & Bá»I Cáº¢NH NGHIá»†P Vá»¤ (EXECUTIVE SUMMARY & BUSINESS CASE)

### 1.1. Bá»‘i cáº£nh thá»±c táº¿ & BÃ i toÃ¡n váº­n hÃ nh
Trong Ä‘á»£t kháº£o sÃ¡t thá»±c táº¿ vÃ o Ä‘áº§u thÃ¡ng 09/2026 táº¡i PhÃ²ng khÃ¡m Äa khoa Quá»‘c táº¿ An TÃ¢m (ÄÃ  Náºµng), nhÃ³m nghiÃªn cá»©u Ä‘Ã£ ghi nháº­n thá»±c tráº¡ng quáº£n lÃ½ khÃ¡m chá»¯a bá»‡nh cÃ²n nhiá»u báº¥t cáº­p:
* HÆ¡n 80% bá»‡nh nhÃ¢n Ä‘áº·t lá»‹ch háº¹n thÃ´ng qua cuá»™c gá»i Ä‘iá»‡n thoáº¡i hoáº·c nháº¯n tin qua trang máº¡ng xÃ£ há»™i khÃ´ng chÃ­nh thá»©c, dáº«n Ä‘áº¿n tÃ¬nh tráº¡ng nhÃ¢n viÃªn lá»… tÃ¢n ghi nháº§m thÃ´ng tin, trÃ¹ng khung giá» khÃ¡m cá»§a bÃ¡c sÄ© (overbooking).
* Thá»i gian chá» Ä‘á»£i trung bÃ¬nh cá»§a má»™t bá»‡nh nhÃ¢n tá»« lÃºc cÃ³ máº·t táº¡i phÃ²ng khÃ¡m Ä‘áº¿n khi Ä‘Æ°á»£c bÃ¡c sÄ© thÄƒm khÃ¡m lÃªn tá»›i 52 phÃºt vÃ o cÃ¡c khung giá» cao Ä‘iá»ƒm.
* Tá»· lá»‡ bá»‡nh nhÃ¢n Ä‘áº·t lá»‹ch nhÆ°ng khÃ´ng Ä‘áº¿n khÃ¡m (No-show rate) trong thÃ¡ng 08/2026 táº¡i cÆ¡ sá»Ÿ Ä‘áº¡t má»©c 26.5%, gÃ¢y lÃ£ng phÃ­ nghiÃªm trá»ng nguá»“n lá»±c bÃ¡c sÄ© vÃ  phÃ²ng á»‘c.
* Há»“ sÆ¡ bá»‡nh Ã¡n giáº¥y truyá»n thá»‘ng gÃ¢y khÃ³ khÄƒn trong viá»‡c tra cá»©u tiá»n sá»­ bá»‡nh, lÃ m tÄƒng nguy cÆ¡ trÃ¹ng láº·p Ä‘Æ¡n thuá»‘c hoáº·c chá»‰ Ä‘á»‹nh xÃ©t nghiá»‡m khÃ´ng cáº§n thiáº¿t.

### 1.2. Giáº£i phÃ¡p pháº§n má»m Ä‘á» xuáº¥t & Sourcing Pathway
NhÃ³m Ä‘Ã£ lá»±a chá»n **Pathway 1: Káº¿ thá»«a / Song hÃ nh Äá»“ Ã¡n ChuyÃªn ngÃ nh**, bao bá»c khung quáº£n trá»‹ dá»± Ã¡n chuyÃªn nghiá»‡p theo chuáº©n PMBOK vÃ  phÆ°Æ¡ng phÃ¡p luáº­n Agile/Scrum quanh ná»n táº£ng pháº§n má»m ká»¹ thuáº­t mang tÃªn **MediCare Plus**. Há»‡ thá»‘ng bao gá»“m:
1. **Cá»•ng Web dÃ nh cho Bá»‡nh nhÃ¢n (Patient Web Portal):** Cho phÃ©p tra cá»©u bÃ¡c sÄ© theo chuyÃªn khoa, Ä‘áº·t háº¹n theo khung giá» trá»‘ng 15 phÃºt, nháº­n phiáº¿u khÃ¡m Ä‘iá»‡n tá»­ cÃ³ mÃ£ QR.
2. **Dashboard BÃ¡c sÄ© & Lá»… tÃ¢n (Clinic Management Console):** Há»— trá»£ lá»… tÃ¢n quÃ©t mÃ£ QR tiáº¿p Ä‘Ã³n bá»‡nh nhÃ¢n trong 3 giÃ¢y, há»— trá»£ bÃ¡c sÄ© xem danh sÃ¡ch hÃ ng Ä‘á»£i thá»i gian thá»±c, ghi chÃ©p bá»‡nh Ã¡n Ä‘iá»‡n tá»­ (EMR) vÃ  xuáº¥t Ä‘Æ¡n thuá»‘c.
3. **Äá»™ng cÆ¡ Äá»“ng bá»™ & Nháº¯c háº¹n (Notification Engine):** Tá»± Ä‘á»™ng gá»­i email xÃ¡c nháº­n Ä‘áº·t háº¹n vÃ  gá»­i thÃ´ng bÃ¡o nháº¯c lá»‹ch trÆ°á»›c 24 giá» vÃ  trÆ°á»›c 2 giá» khÃ¡m.

### 1.3. ÄÃ¡nh giÃ¡ Má»©c Ä‘á»™ Äáº¡t Ä‘Æ°á»£c Má»¥c tiÃªu SMART sau 15 Tuáº§n

| TiÃªu chÃ­ SMART | Má»¥c tiÃªu cam káº¿t ban Ä‘áº§u (Baseline) | Káº¿t quáº£ thá»±c táº¿ Ä‘áº¡t Ä‘Æ°á»£c sau 15 tuáº§n | ÄÃ¡nh giÃ¡ |
| :--- | :--- | :--- | :---: |
| **S (Specific)** | XÃ¢y dá»±ng trá»n váº¹n 3 phÃ¢n há»‡: Web Bá»‡nh nhÃ¢n, Dashboard PhÃ²ng khÃ¡m, Backend API. | ÄÃ£ hoÃ n thÃ nh vÃ  triá»ƒn khai thá»±c táº¿ 3 phÃ¢n há»‡ trÃªn Cloud Vercel & Render. | **Äáº T** |
| **M (Measurable)** | Thá»i gian chá» khÃ¡m $\le 15$ phÃºt; Tá»· lá»‡ No-show $\le 10\%$; Response API $< 300\text{ms}$. | Thá»i gian chá» Ä‘o lÆ°á»ng thá»±c táº¿: **11.4 phÃºt**; Tá»· lá»‡ No-show: **7.2%**; API Latency trung bÃ¬nh: **218ms**. | **VÆ¯á»¢T CHá»ˆ TIÃŠU** |
| **A (Achievable)** | NhÃ³m 5 thÃ nh viÃªn phÃ¢n bá»• Ä‘á»u khá»‘i lÆ°á»£ng cÃ´ng viá»‡c, hoÃ n thÃ nh qua 5 Sprint. | NhÃ³m Ä‘Ã£ hoÃ n thÃ nh 100% cÃ¡c User Story cam káº¿t, tá»· lá»‡ Ä‘Ã³ng gÃ³p cá»§a 5 thÃ nh viÃªn Ä‘á»“ng Ä‘á»u tá»« 19.5% Ä‘áº¿n 20.5%. | **Äáº T** |
| **R (Relevant)** | Giáº£i quyáº¿t bÃ i toÃ¡n thá»±c táº¿ cÃ³ sá»± nghiá»‡m thu cá»§a Giáº£ng viÃªn chuyÃªn ngÃ nh vÃ  nhÃ³m ngÆ°á»i dÃ¹ng thá»­ nghiá»‡m VKU. | ÄÃ£ triá»ƒn khai thá»­ nghiá»‡m thá»±c táº¿ vá»›i 20 ngÆ°á»i dÃ¹ng táº¡i VKU, Ä‘Æ°á»£c Giáº£ng viÃªn hÆ°á»›ng dáº«n chuyÃªn ngÃ nh ThS. LÃª ÄÄƒng Quang Ä‘Ã¡nh giÃ¡ vÃ  nghiá»‡m thu chá»©c nÄƒng. | **Äáº T** |
| **T (Time-bound)** | BÃ n giao Ä‘Ãºng háº¡n vÃ o Tuáº§n 14, báº£o vá»‡ vÃ o Tuáº§n 15. | Ná»™p toÃ n bá»™ há»“ sÆ¡ GÃ³i báº±ng chá»©ng vÃ o ngÃ y 10/12/2026 (Tuáº§n 14), báº£o vá»‡ thÃ nh cÃ´ng táº¡i Tuáº§n 15. | **Äáº T** |

---

## CHÆ¯Æ NG 2: Lá»°A CHá»ŒN PHÆ¯Æ NG PHÃP LUáº¬N & CÆ  Cáº¤U QUáº¢N TRá»Š (METHODOLOGY & TEAM GOVERNANCE)

### 2.1. Giáº£i trÃ¬nh lá»±a chá»n phÆ°Æ¡ng phÃ¡p luáº­n Agile/Scrum
Trong bá»‘i cáº£nh yÃªu cáº§u nghiá»‡p vá»¥ y táº¿ thÆ°á»ng xuyÃªn cÃ³ nhá»¯ng Ä‘iá»u chá»‰nh tá»« phÃ­a bÃ¡c sÄ© vÃ  tiáº¿p tÃ¢n, nhÃ³m Ä‘Ã£ quyáº¿t Ä‘á»‹nh Ã¡p dá»¥ng **MÃ´ hÃ¬nh Hybrid: Scrum káº¿t há»£p Kanban**:
* **Khung thá»i gian Sprint cá»‘ Ä‘á»‹nh (Time-boxed Sprint):** Chia toÃ n bá»™ 15 tuáº§n thÃ nh **5 Sprint**, má»—i Sprint kÃ©o dÃ i 2 tuáº§n. Tuáº§n 1 dÃ nh cho Khá»Ÿi táº¡o (Sprint 0) vÃ  Tuáº§n 14â€“15 dÃ nh cho Nghiá»‡m thu & Báº£o vá»‡ (Sprint Final).
* **Nghi thá»©c Scrum nghiÃªm ngáº·t (Scrum Ceremonies):**
  * *Sprint Planning:* Tá»• chá»©c vÃ o chiá»u Chá»§ nháº­t Ä‘áº§u Sprint, Æ°á»›c lÆ°á»£ng Story Point báº±ng Planning Poker trÃªn GitHub Issues.
  * *Daily Standup:* Há»p trá»±c tuyáº¿n 15 phÃºt vÃ o cÃ¡c ngÃ y Thá»© 2, Thá»© 4, Thá»© 6 lÃºc 07:30 sÃ¡ng, giáº£i quyáº¿t ngay cÃ¡c trá»Ÿ ngáº¡i (Blockers).
  * *Sprint Review & Live Demo:* TrÃ¬nh diá»…n sáº£n pháº©m cháº¡y thá»±c táº¿ cho Product Owner vÃ o tá»‘i Thá»© 7 cuá»‘i Sprint.
  * *Sprint Retrospective:* Sá»­ dá»¥ng mÃ´ hÃ¬nh **4Ls (Liked, Learned, Lacked, Longed for)** Ä‘á»ƒ cáº£i tiáº¿n liÃªn tá»¥c quy trÃ¬nh phÃ¡t triá»ƒn vÃ  kiá»ƒm thá»­.
* **Báº£ng Kanban trá»±c quan:** Phá»‘i há»£p theo dÃµi tráº¡ng thÃ¡i cÃ´ng viá»‡c qua GitHub Projects Table/Board vá»›i nguyÃªn táº¯c giá»›i háº¡n cÃ´ng viá»‡c Ä‘ang xá»­ lÃ½ (WIP Limit $\le 2$ tasks/ká»¹ sÆ°) nháº±m loáº¡i bá» nÃºt tháº¯t cá»• chai.

### 2.2. CÆ¡ cáº¥u tá»• chá»©c & PhÃ¢n Ä‘á»‹nh trÃ¡ch nhiá»‡m 5 vai trÃ² ká»¹ thuáº­t
NhÃ³m Ä‘Ã£ cÆ¡ cáº¥u tá»• chá»©c theo Ä‘Ãºng chuáº©n cÃ´ng nghiá»‡p 5 vai trÃ² ká»¹ thuáº­t, thiáº¿t láº­p ma tráº­n trÃ¡ch nhiá»‡m RACI vÃ  ghi nháº­n tá»· lá»‡ Ä‘Ã³ng gÃ³p thá»±c táº¿:
1. **Nguyá»…n VÄƒn An (Project Manager / Scrum Master - 22IT001):** ÄÃ³ng gÃ³p **20%**. Quáº£n lÃ½ tiáº¿n Ä‘á»™ trÃªn GitHub Projects, tá»• chá»©c 100% cÃ¡c phiÃªn há»p Daily Scrum vÃ  Retro, Ä‘iá»u phá»‘i rá»§i ro vÃ  lÃ m viá»‡c trá»±c tiáº¿p vá»›i khÃ¡ch hÃ ng.
2. **Tráº§n ÄÃ¬nh BÃ¬nh (Technical Lead / System Architect - 22IT002):** ÄÃ³ng gÃ³p **20%**. Thiáº¿t káº¿ sÆ¡ Ä‘á»“ CSDL PostgreSQL, thiáº¿t láº­p Ä‘Æ°á»ng á»‘ng CI/CD GitHub Actions, phÃª duyá»‡t (Review & Approve) 48/52 Pull Requests quan trá»ng.
3. **LÃª Thá»‹ Cáº©m (Backend Engineer - 22IT003):** ÄÃ³ng gÃ³p **20%**. XÃ¢y dá»±ng 28 RESTful API endpoints, giáº£i quyáº¿t triá»‡t Ä‘á»ƒ lá»—i Concurrency Locking trong giao dá»‹ch Ä‘áº·t háº¹n, tÃ­ch há»£p thÆ° viá»‡n gá»­i thÃ´ng bÃ¡o email tá»± Ä‘á»™ng.
4. **Pháº¡m Quá»‘c DÅ©ng (Frontend / Mobile Engineer - 22IT004):** ÄÃ³ng gÃ³p **20%**. PhÃ¡t triá»ƒn giao diá»‡n Web Responsive báº±ng Next.js vÃ  á»©ng dá»¥ng di Ä‘á»™ng Flutter cho bá»‡nh nhÃ¢n, Ä‘áº£m báº£o chuáº©n Mobile-First vÃ  tÆ°Æ¡ng thÃ­ch Ä‘a trÃ¬nh duyá»‡t.
5. **HoÃ ng Minh Em (QA & Test Engineer - 22IT005):** ÄÃ³ng gÃ³p **20%**. Thiáº¿t káº¿ Ma tráº­n kiá»ƒm thá»­ gá»“m 64 test cases, viáº¿t 42 Unit Tests tá»± Ä‘á»™ng, thá»±c hiá»‡n kiá»ƒm thá»­ táº£i báº±ng k6 vÃ  tá»•ng há»£p GÃ³i báº±ng chá»©ng kiá»ƒm toÃ¡n.

---

## CHÆ¯Æ NG 3: ÄÆ¯á»œNG CÆ  Sá»ž PHáº M VI & PHÃ‚N RÃƒ CÃ”NG VIá»†C (SCOPE BASELINE, WBS & WBS DICTIONARY)

### 3.1. Äáº·c táº£ pháº¡m vi In-Scope vÃ  Out-of-Scope thá»±c thi
NhÃ³m Ä‘Ã£ xÃ¡c láº­p vÃ  bÃ¡m sÃ¡t Ä‘Æ°á»ng cÆ¡ sá»Ÿ pháº¡m vi (Scope Baseline) Ä‘Æ°á»£c phÃª duyá»‡t trong Project Charter:
* **Háº¡ng má»¥c Ä‘Ã£ hoÃ n thÃ nh 100% (In-Scope):** Module ÄÄƒng nháº­p & RBAC 4 vai trÃ²; Module TÃ¬m kiáº¿m BÃ¡c sÄ© & Äáº·t lá»‹ch Ä‘a tiÃªu chÃ­; Thuáº­t toÃ¡n KhÃ³a slot khÃ¡m chá»‘ng trÃ¹ng láº·p; Giao diá»‡n Tiáº¿p Ä‘Ã³n bá»‡nh nhÃ¢n báº±ng mÃ£ QR; Module Quáº£n lÃ½ Bá»‡nh Ã¡n Ä‘iá»‡n tá»­ EMR; Engine gá»­i email thÃ´ng bÃ¡o tá»± Ä‘á»™ng; Háº¡ táº§ng CI/CD tá»± Ä‘á»™ng deploy lÃªn Cloud.
* **Háº¡ng má»¥c chá»§ Ä‘á»™ng loáº¡i trá»« (Out-of-Scope):** Thanh toÃ¡n báº£o hiá»ƒm y táº¿ nhÃ  nÆ°á»›c (BHYT); Module KhÃ¡m bá»‡nh tá»« xa qua video call (Telemedicine) Ä‘Ã£ Ä‘Æ°á»£c chÃ­nh thá»©c dá»i sang giai Ä‘oáº¡n 2 thÃ´ng qua biÃªn báº£n Change Request CR-01.

### 3.2. SÆ¡ Ä‘á»“ cÃ¢y phÃ¢n rÃ£ cÃ´ng viá»‡c WBS & TuÃ¢n thá»§ NguyÃªn táº¯c 100%
CÃ¢y WBS Ä‘Ã£ phÃ¢n rÃ£ toÃ n bá»™ dá»± Ã¡n thÃ nh 6 phÃ¢n há»‡ chÃ­nh (Cáº¥p 2) vÃ  22 gÃ³i cÃ´ng viá»‡c (Cáº¥p 3). Tá»•ng thá»ƒ 22 gÃ³i cÃ´ng viá»‡c nÃ y Ä‘Ã£ bao quÃ¡t trá»n váº¹n 100% khá»‘i lÆ°á»£ng cÃ´ng viá»‡c cá»§a dá»± Ã¡n, khÃ´ng cÃ³ gÃ³i cÃ´ng viá»‡c nÃ o náº±m ngoÃ i má»¥c tiÃªu vÃ  khÃ´ng cÃ³ sá»± chá»“ng chÃ©o giá»¯a cÃ¡c thÃ nh viÃªn.

### 3.3. TrÃ­ch xuáº¥t Tá»« Ä‘iá»ƒn WBS cho cÃ¡c gÃ³i cÃ´ng viá»‡c cá»‘t lÃµi
* **GÃ³i WP 1.3.3 (Module KhÃ³a Slot KhÃ¡m - Pessimistic Lock):** 35 giá» cÃ´ng, ngÆ°á»i thá»±c hiá»‡n LÃª Thá»‹ Cáº©m & Tráº§n ÄÃ¬nh BÃ¬nh. Äáº§u vÃ o: Báº£ng CSDL `time_slots`. Äáº§u ra: HÃ m xá»­ lÃ½ transaction an toÃ n báº±ng cÃº phÃ¡p `SELECT ... FOR UPDATE` trong PostgreSQL. TiÃªu chÃ­ hoÃ n thÃ nh (DoD): 100% vÆ°á»£t qua bÃ i kiá»ƒm tra táº£i Ä‘á»“ng thá»i cá»§a QA, khÃ´ng cÃ³ slot nÃ o bá»‹ Ä‘áº·t 2 láº§n.
* **GÃ³i WP 1.4.2 (Dashboard Lá»… tÃ¢n & BÃ¡c sÄ©):** 30 giá» cÃ´ng, ngÆ°á»i thá»±c hiá»‡n Pháº¡m Quá»‘c DÅ©ng. Äáº§u vÃ o: API EMR vÃ  API HÃ ng Ä‘á»£i. Äáº§u ra: MÃ n hÃ¬nh quÃ©t QR Code check-in thá»i gian thá»±c. TiÃªu chÃ­ hoÃ n thÃ nh (DoD): Thá»i gian quÃ©t mÃ£ vÃ  cáº­p nháº­t tráº¡ng thÃ¡i "ÄÃ£ cÃ³ máº·t" diá»…n ra trong dÆ°á»›i 3 giÃ¢y.

---

## CHÆ¯Æ NG 4: Æ¯á»šC LÆ¯á»¢NG, Lá»ŠCH TRÃŒNH & Váº¬N Tá»C Äá»˜I NGÅ¨ (ESTIMATION, CPM SCHEDULE & VELOCITY)

### 4.1. PhÆ°Æ¡ng phÃ¡p Æ°á»›c lÆ°á»£ng Story Points qua Planning Poker
NhÃ³m Ä‘Ã£ sá»­ dá»¥ng dÃ£y sá»‘ Fibonacci ($1, 2, 3, 5, 8, 13, 21$) Ä‘á»ƒ Æ°á»›c lÆ°á»£ng Ä‘á»™ phá»©c táº¡p cá»§a tá»«ng User Story dá»±a trÃªn 3 tiÃªu chÃ­: Khá»‘i lÆ°á»£ng cÃ´ng viá»‡c (Effort), Äá»™ phá»©c táº¡p ká»¹ thuáº­t (Complexity), vÃ  Má»©c Ä‘á»™ rá»§i ro/chÆ°a rÃµ rÃ ng (Uncertainty). Cáº£ 5 thÃ nh viÃªn Ä‘Ã£ cÃ¹ng bá» phiáº¿u Ä‘á»™c láº­p qua tiá»‡n Ã­ch tÃ­ch há»£p trÃªn GitHub Issues; cÃ¡c task cÃ³ sá»± chÃªnh lá»‡ch lá»›n giá»¯a cÃ¡c phiáº¿u Ä‘Ã£ Ä‘Æ°á»£c tháº£o luáº­n lÃ m rÃµ trÆ°á»›c khi chá»‘t Story Point cuá»‘i cÃ¹ng.

### 4.2. SÆ¡ Ä‘á»“ máº¡ng CPM & PhÃ¢n tÃ­ch ÄÆ°á»ng gÄƒng (Critical Path Method)
NhÃ³m Ä‘Ã£ xÃ¢y dá»±ng sÆ¡ Ä‘á»“ máº¡ng tiáº¿n Ä‘á»™ CPM Ä‘á»ƒ xÃ¡c Ä‘á»‹nh Ä‘Æ°á»ng gÄƒng cá»§a dá»± Ã¡n. 
* **ÄÆ°á»ng gÄƒng (Critical Path):**  
  `1.1.1 (Charter) âž” 1.2.2 (Thiáº¿t káº¿ DB) âž” 1.3.1 (Auth API) âž” 1.3.3 (Core Booking Engine) âž” 1.4.1 (Web Portal) âž” 1.5.3 (Load Test) âž” 1.6.1 (Cloud Deploy) âž” 1.6.2 (UAT Sign-off)`.
* **Tá»•ng thá»i gian Ä‘Æ°á»ng gÄƒng:** 13.5 tuáº§n. 
* Báº¥t ká»³ sá»± cháº­m trá»… nÃ o trÃªn cÃ¡c gÃ³i cÃ´ng viá»‡c thuá»™c Ä‘Æ°á»ng gÄƒng Ä‘á»u lÃ m áº£nh hÆ°á»Ÿng trá»±c tiáº¿p Ä‘áº¿n ngÃ y nghiá»‡m thu cuá»‘i ká»³. Do Ä‘Ã³, PM vÃ  Tech Lead Ä‘Ã£ táº­p trung 70% ná»— lá»±c giÃ¡m sÃ¡t vÃ  giáº£i phÃ³ng trá»Ÿ ngáº¡i vÃ o cÃ¡c gÃ³i cÃ´ng viá»‡c nÃ y.

### 4.3. PhÃ¢n tÃ­ch Váº­n tá»‘c thá»±c táº¿ (Velocity) & Biá»ƒu Ä‘á»“ Burndown qua cÃ¡c Sprint

| Sprint | Thá»i gian | Má»¥c tiÃªu Sprint | Story Points Cam káº¿t | Story Points HoÃ n thÃ nh | Tá»· lá»‡ Äáº¡t (%) |
| :---: | :---: | :--- | :---: | :---: | :---: |
| **Sprint 1** | W02 â€” W03 | Thiáº¿t láº­p há»‡ thá»‘ng, Kiáº¿n trÃºc DB, API Auth | 30 SP | 30 SP | 100% |
| **Sprint 2** | W04 â€” W05 | Äáº·t lá»‹ch cá»‘t lÃµi, Danh má»¥c BÃ¡c sÄ© (MVP) | 42 SP | 38 SP | 90.5% |
| **Sprint 3** | W06 â€” W07 | Xá»­ lÃ½ Concurrency Locking, Web Bá»‡nh nhÃ¢n | 36 SP | 36 SP | 100% |
| **Sprint 4** | W08 â€” W09 | QR Check-in (CR-01), Dashboard BÃ¡c sÄ© & EMR | 32 SP | 34 SP | 106.2% |
| **Sprint 5** | W10 â€” W11 | Tá»‘i Æ°u hÃ³a hiá»‡u nÄƒng, Load test k6, UAT Cloud | 28 SP | 28 SP | 100% |
| **Tá»•ng cá»™ng**| **10 tuáº§n dev** | **ToÃ n bá»™ há»‡ thá»‘ng hoÃ n chá»‰nh** | **168 SP** | **166 SP** | **98.8%** |

* **ÄÃ¡nh giÃ¡ biá»ƒu Ä‘á»“ Burndown:** Táº¡i Sprint 2, Ä‘Æ°á»ng thá»±c táº¿ (Actual) cÃ³ thá»i Ä‘iá»ƒm náº±m trÃªn Ä‘Æ°á»ng lÃ½ thuyáº¿t (Ideal) do phÃ¡t sinh lá»—i Race Condition á»Ÿ Tuáº§n 5. Tuy nhiÃªn, sau khi hoÃ n thÃ nh tÃ¡i cáº¥u trÃºc logic khÃ³a slot, biá»ƒu Ä‘á»“ Burndown táº¡i Sprint 3 vÃ  Sprint 4 Ä‘Ã£ tiá»‡m cáº­n hoÃ n háº£o vá» 0 vÃ o ngÃ y cuá»‘i cÃ¹ng cá»§a Sprint. Váº­n tá»‘c trung bÃ¬nh cá»§a nhÃ³m á»•n Ä‘á»‹nh á»Ÿ má»©c **33.2 Story Points / Sprint**.

---

## CHÆ¯Æ NG 5: THá»°C THI & KIá»‚M SOÃT CHáº¤T LÆ¯á»¢NG (EXECUTION, TESTING, CI/CD & DOD)

### 5.1. PhÃ¢n tÃ­ch lá»‹ch sá»­ Commit & Dá»¯ liá»‡u kiá»ƒm toÃ¡n GitHub (Git Audit)
Kho mÃ£ nguá»“n cá»§a nhÃ³m Ä‘Ã£ chá»©ng minh tÃ­nh chÃ¢n thá»±c tuyá»‡t Ä‘á»‘i thÃ´ng qua cÃ¡c chá»‰ sá»‘ kiá»ƒm toÃ¡n:
* **Tá»•ng sá»‘ commits:** 284 commits tráº£i Ä‘á»u liÃªn tá»¥c trong 15 tuáº§n há»c ká»³. Tuyá»‡t Ä‘á»‘i khÃ´ng cÃ³ hÃ nh vi "dump commit" vÃ o cuá»‘i ká»³.
* **Sá»‘ lÆ°á»£ng Pull Requests (PR):** 52 PRs Ä‘Æ°á»£c táº¡o vÃ  sÃ¡p nháº­p vÃ o nhÃ¡nh chÃ­nh. 100% PRs Ä‘á»u tuÃ¢n thá»§ quy trÃ¬nh kiá»ƒm thá»­ chÃ©o vÃ  cÃ³ Ã­t nháº¥t 01 thÃ nh viÃªn duyá»‡t chÃ­nh thá»©c.
* **PhÃ¢n bá»• commit giá»¯a cÃ¡c thÃ nh viÃªn:**
  * Nguyá»…n VÄƒn An (PM/Docs): 46 commits (16.2%)
  * Tráº§n ÄÃ¬nh BÃ¬nh (Tech Lead/CI): 68 commits (23.9%)
  * LÃª Thá»‹ Cáº©m (Backend): 72 commits (25.4%)
  * Pháº¡m Quá»‘c DÅ©ng (Frontend): 65 commits (22.9%)
  * HoÃ ng Minh Em (QA/Test): 33 commits (11.6%)

### 5.2. ÄÆ°á»ng á»‘ng Tá»± Ä‘á»™ng hÃ³a CI/CD (GitHub Actions Pipeline)
NhÃ³m Ä‘Ã£ thiáº¿t láº­p pipeline `.github/workflows/ci.yml` tá»± Ä‘á»™ng cháº¡y má»—i khi cÃ³ thao tÃ¡c Push hoáº·c táº¡o Pull Request:
* **BÆ°á»›c 1 (Code Quality):** Cháº¡y `npm run lint` vÃ  `prettier --check` Ä‘á»ƒ Ä‘áº£m báº£o chuáº©n Ä‘á»‹nh dáº¡ng code Ä‘á»“ng nháº¥t.
* **BÆ°á»›c 2 (Automated Test):** Cháº¡y `pytest` cho backend vÃ  `jest` cho frontend. Kiá»ƒm tra tá»· lá»‡ bao phá»§ mÃ£ nguá»“n (Code Coverage).
* **BÆ°á»›c 3 (Build Verification):** Thá»±c hiá»‡n `npm run build` trÃªn container Ubuntu áº£o hÃ³a Ä‘á»ƒ Ä‘áº£m báº£o mÃ£ nguá»“n khÃ´ng cÃ³ lá»—i biÃªn dá»‹ch.
* **BÆ°á»›c 4 (Auto-deployment):** Sau khi merge PR vÃ o nhÃ¡nh `main`, há»‡ thá»‘ng tá»± Ä‘á»™ng kÃ­ch hoáº¡t webhook triá»ƒn khai báº£n build má»›i lÃªn mÃ´i trÆ°á»ng Live Production táº¡i Vercel vÃ  Render.

### 5.3. BÃ¡o cÃ¡o Káº¿t quáº£ Kiá»ƒm thá»­ & Äáº£m báº£o Definition of Done (DoD)
* **Kiá»ƒm thá»­ ÄÆ¡n vá»‹ & TÃ­ch há»£p (Unit & Integration Tests):** ÄÃ£ xÃ¢y dá»±ng 42 unit test cases tá»± Ä‘á»™ng, Ä‘á»™ bao phá»§ mÃ£ nguá»“n Ä‘áº¡t **78.4%** (vÆ°á»£t ngÆ°á»¡ng yÃªu cáº§u 70% cá»§a DoD).
* **Kiá»ƒm thá»­ Táº£i Ä‘á»“ng thá»i (Concurrency Load Test k6):** Giáº£ láº­p 50 requests Ä‘á»“ng thá»i gá»­i Ä‘áº¿n endpoint `/api/v1/appointments/book` cÃ¹ng chá»n má»™t mÃ£ slot `SLOT_DOC01_20261120_0830`. Káº¿t quáº£: ÄÃºng 01 giao dá»‹ch nháº­n HTTP 201 Created vÃ  ghi nháº­n vÃ o DB; 49 giao dá»‹ch cÃ²n láº¡i nháº­n HTTP 409 Conflict vá»›i thÃ´ng bÃ¡o lá»—i rÃµ rÃ ng. KhÃ´ng xáº£y ra lá»—i duplicate dá»¯ liá»‡u.
* **Kiá»ƒm thá»­ Hiá»‡u nÄƒng:** Thá»i gian pháº£n há»“i trung bÃ¬nh cá»§a há»‡ thá»‘ng lÃ  **218ms** vá»›i táº£i 100 ngÆ°á»i dÃ¹ng Ä‘á»“ng thá»i.

---

## CHÆ¯Æ NG 6: QUáº¢N TRá»Š Rá»¦I RO & KIá»‚M SOÃT THAY Äá»”I PHáº M VI (RISK EVOLUTION & SCOPE CHANGE CONTROL)

### 6.1. Tiáº¿n hÃ³a cá»§a Báº£ng theo dÃµi rá»§i ro qua 2 Ä‘á»£t Ä‘Ã¡nh giÃ¡
NhÃ³m Ä‘Ã£ chá»§ Ä‘á»™ng theo dÃµi vÃ  cáº­p nháº­t ma tráº­n rá»§i ro qua 2 má»‘c quan trá»ng:
* **Äá»£t 1 (Sprint 1 Review - Tuáº§n 6):** Nháº­n diá»‡n rá»§i ro R-01 (Race condition) chuyá»ƒn thÃ nh biáº¿n cá»‘ thá»±c táº¿ khi há»‡ thá»‘ng bá»‹ trÃ¹ng lá»‹ch lÃºc test thá»­. NhÃ³m Ä‘Ã£ ká»‹p thá»i nÃ¢ng cáº¥p kiáº¿n trÃºc CSDL vÃ  giáº£m thiá»ƒu má»©c Ä‘á»™ rá»§i ro tá»« 16 (Critical) xuá»‘ng 8 (Medium). Äá»“ng thá»i phÃ¡t hiá»‡n rá»§i ro thá»i gian khá»Ÿi Ä‘á»™ng cháº­m (Cold-start) cá»§a Render Free-tier (R-03) vÃ  xá»­ lÃ½ báº±ng ká»‹ch báº£n UptimeRobot ping tá»± Ä‘á»™ng.
* **Äá»£t 2 (Sprint 2 Review - Tuáº§n 11):** Sau khi hoÃ n táº¥t kiá»ƒm thá»­ táº£i k6 vÃ  nghiá»‡m thu tÃ­nh nÄƒng khÃ³a slot, Ä‘iá»ƒm sá»‘ rá»§i ro R-01 giáº£m xuá»‘ng má»©c an toÃ n (Äiá»ƒm 3 - Low) vÃ  chÃ­nh thá»©c Ä‘Æ°á»£c Ä‘Ã³ng (Closed). Rá»§i ro quÃ¡ táº£i há»c táº­p giá»¯a ká»³ (R-04) Ä‘Æ°á»£c kiá»ƒm soÃ¡t thÃ nh cÃ´ng báº±ng cÃ¡ch Ä‘iá»u chá»‰nh Sprint Buffer.

### 6.2. Há»“ sÆ¡ Xá»­ lÃ½ Thay Ä‘á»•i Pháº¡m vi Thá»±c táº¿ (Approved Change Request CR-01)
Thá»±c hiá»‡n yÃªu cáº§u báº¯t buá»™c cá»§a mÃ´n há»c vá» viá»‡c Ä‘á»‘i máº·t vÃ  xá»­ lÃ½ thÃ nh cÃ´ng Ã­t nháº¥t 01 biáº¿n cá»‘ quáº£n lÃ½ thá»±c táº¿:
* **TÃªn biáº¿n cá»‘:** YÃªu cáº§u thay Ä‘á»•i pháº¡m vi tá»« phÃ­a KhÃ¡ch hÃ ng (Scope Change Request CR-01).
* **Bá»‘i cáº£nh phÃ¡t sinh:** VÃ o Tuáº§n 7, sau khi Ä‘Ã¡nh giÃ¡ báº£n demo Sprint 1, Giáº£ng viÃªn hÆ°á»›ng dáº«n chuyÃªn ngÃ nh cÃ¹ng cá»‘ váº¥n nghiá»‡p vá»¥ y táº¿ Ä‘Ã£ yÃªu cáº§u bá»• sung gáº¥p tÃ­nh nÄƒng *"Tiáº¿p Ä‘Ã³n bá»‡nh nhÃ¢n báº±ng mÃ£ QR táº¡i sáº£nh vÃ  hiá»ƒn thá»‹ danh sÃ¡ch hÃ ng Ä‘á»£i trá»±c quan"* nháº±m nÃ¢ng cao tÃ­nh á»©ng dá»¥ng thá»±c táº¿ vÃ  giáº£i quyáº¿t nÃºt tháº¯t Ã¹n á»© khi bá»‡nh nhÃ¢n Ä‘áº¿n tiáº¿p Ä‘Ã³n.
* **Quy trÃ¬nh xá»­ lÃ½ cá»§a Há»™i Ä‘á»“ng Kiá»ƒm soÃ¡t Thay Ä‘á»•i (CCB):**
  1. *Tiáº¿p nháº­n yÃªu cáº§u:* PM ghi nháº­n vÃ o biá»ƒu máº«u Change Request Form `CR-01`.
  2. *ÄÃ¡nh giÃ¡ tÃ¡c Ä‘á»™ng (Impact Analysis):* Tech Lead vÃ  Backend Engineer tÃ­nh toÃ¡n tÃ­nh nÄƒng má»›i cáº§n bá»• sung 12 Story Points (~25 giá» lÃ m viá»‡c). Náº¿u giá»¯ nguyÃªn toÃ n bá»™ pháº¡m vi ban Ä‘áº§u, dá»± Ã¡n sáº½ Ä‘á»‘i máº·t vá»›i nguy cÆ¡ trá»… háº¡n 1.5 tuáº§n.
  3. *Há»p thÆ°Æ¡ng lÆ°á»£ng giáº£i phÃ¡p (Scope Trade-off):* PM Ä‘Ã£ tá»• chá»©c há»p vá»›i Giáº£ng viÃªn chuyÃªn ngÃ nh vÃ  TS. Nguyá»…n Thanh Tuáº¥n, Ä‘á» xuáº¥t phÆ°Æ¡ng Ã¡n Ä‘Ã¡nh Ä‘á»•i: **Cháº¥p thuáº­n phÃ¡t triá»ƒn module Tiáº¿p Ä‘Ã³n mÃ£ QR**, Ä‘á»“ng thá»i **chuyá»ƒn tÃ­nh nÄƒng KhÃ¡m bá»‡nh tá»« xa qua Video call (Telemedicine) sang Giai Ä‘oáº¡n 2 (Future Release)**.
  4. *PhÃª duyá»‡t & Äiá»u chá»‰nh WBS:* BiÃªn báº£n thá»a thuáº­n Ä‘Æ°á»£c cÃ¡c bÃªn kÃ½ duyá»‡t ngÃ y 24/10/2026. PM Ä‘Ã£ cáº­p nháº­t láº¡i WBS (bá»• sung gÃ³i 1.4.2 Ä‘iá»u chá»‰nh), Ä‘Æ°a cÃ¡c User Stories má»›i vÃ o Sprint 4 Backlog vÃ  nhÃ³m Ä‘Ã£ hoÃ n thÃ nh Ä‘Ãºng háº¡n mÃ  khÃ´ng lÃ m vá»¡ lá»‹ch trÃ¬nh dá»± Ã¡n.

---

## CHÆ¯Æ NG 7: NGHIá»†M THU, ÄÃ“NG Dá»° ÃN & BÃ€I Há»ŒC KINH NGHIá»†M (PROJECT CLOSURE, UAT & LESSONS LEARNED)

### 7.1. Káº¿t quáº£ Kiá»ƒm thá»­ Cháº¥p nháº­n NgÆ°á»i dÃ¹ng (UAT) & Nghiá»‡m thu ChuyÃªn ngÃ nh Song hÃ nh
VÃ o ngÃ y 02/12/2026 (Tuáº§n 13), nhÃ³m Ä‘Ã£ tiáº¿n hÃ nh phiÃªn thá»­ nghiá»‡m UAT vÃ  nghiá»‡m thu ká»¹ thuáº­t chuyÃªn ngÃ nh vá»›i sá»± tham gia cá»§a Giáº£ng viÃªn hÆ°á»›ng dáº«n Ä‘á»“ Ã¡n chuyÃªn ngÃ nh ThS. LÃª ÄÄƒng Quang cÃ¹ng nhÃ³m 20 sinh viÃªn vÃ  cÃ¡n bá»™ y táº¿ VKU Ä‘Ã³ng vai trÃ² ngÆ°á»i dÃ¹ng thá»­ nghiá»‡m thá»±c táº¿ (Beta Testers):
* **100% (20/20)** ca Ä‘áº·t lá»‹ch qua web vÃ  quÃ©t mÃ£ QR tiáº¿p Ä‘Ã³n diá»…n ra trÆ¡n tru, khÃ´ng xáº£y ra sá»± cá»‘ ngháº½n máº¡ng hay lá»—i pháº§n má»m.
* **85%** ngÆ°á»i dÃ¹ng pháº£n há»“i giao diá»‡n dá»… sá»­ dá»¥ng, thá»i gian Ä‘áº·t háº¹n trung bÃ¬nh chá»‰ máº¥t 1.5 phÃºt.
* Giáº£ng viÃªn hÆ°á»›ng dáº«n chuyÃªn ngÃ nh ThS. LÃª ÄÄƒng Quang Ä‘Ã£ Ä‘Ã¡nh giÃ¡, xÃ¡c nháº­n cÃ¡c tÃ­nh nÄƒng ká»¹ thuáº­t Ä‘Ã¡p á»©ng Ä‘áº§y Ä‘á»§ tiÃªu chÃ­ Ä‘á»“ Ã¡n chuyÃªn ngÃ nh vÃ  Ä‘á»“ng thuáº­n káº¿t quáº£ nghiá»‡m thu ká»¹ thuáº­t.

### 7.2. BÃ n giao Sáº£n pháº©m & TÃ¬nh tráº¡ng Hoáº¡t Ä‘á»™ng Thá»±c táº¿
* Há»‡ thá»‘ng Web Bá»‡nh nhÃ¢n Ä‘ang váº­n hÃ nh cÃ´ng khai táº¡i: `https://medicare-plus.vercel.app`
* Dashboard BÃ¡c sÄ© & Quáº£n trá»‹ Ä‘ang váº­n hÃ nh táº¡i: `https://medicare-admin.vercel.app`
* Há»‡ thá»‘ng Backend API vá»›i tÃ i liá»‡u Swagger Ä‘ang hoáº¡t Ä‘á»™ng á»•n Ä‘á»‹nh táº¡i: `https://api.medicare-plus.tech/docs`

### 7.3. BÃ i há»c Kinh nghiá»‡m SÃ¢u sáº¯c (Top Lessons Learned)
1. **BÃ i há»c vá» Kiá»ƒm soÃ¡t Pháº¡m vi (Scope Baseline is King):** KhÃ´ng bao giá» Ä‘á»“ng Ã½ bá»• sung tÃ­nh nÄƒng má»›i má»™t cÃ¡ch tÃ¹y tiá»‡n mÃ  khÃ´ng thá»±c hiá»‡n phÃ¢n tÃ­ch tÃ¡c Ä‘á»™ng vÃ  Ä‘Ã¡nh Ä‘á»•i pháº¡m vi (Trade-off). Viá»‡c tuÃ¢n thá»§ quy trÃ¬nh CCB Ä‘Ã£ cá»©u dá»± Ã¡n khá»i nguy cÆ¡ vá»¡ tiáº¿n Ä‘á»™.
2. **BÃ i há»c vá» Kiá»ƒm thá»­ Äá»“ng thá»i Sá»›m (Fail Fast on Concurrency):** Logic Ä‘áº·t lá»‹ch khÃ¡m vÃ  giá»¯ chá»— luÃ´n tiá»m áº©n rá»§i ro Race Condition nghiÃªm trá»ng. Cáº§n thiáº¿t káº¿ giáº£i phÃ¡p khÃ³a dÃ²ng CSDL (Row-level lock) vÃ  viáº¿t ká»‹ch báº£n load test k6 ngay tá»« giai Ä‘oáº¡n MVP thay vÃ¬ Ä‘á»£i Ä‘áº¿n cuá»‘i ká»³ má»›i kiá»ƒm thá»­.
3. **BÃ i há»c vá» VÄƒn hÃ³a PhÃª duyá»‡t MÃ£ nguá»“n (Peer Review Culture):** Viá»‡c kÃ­ch hoáº¡t Branch Protection trÃªn GitHub vÃ  báº¯t buá»™c Ã­t nháº¥t 1 thÃ nh viÃªn review code trÆ°á»›c khi merge Ä‘Ã£ giÃºp nhÃ³m phÃ¡t hiá»‡n sá»›m hÆ¡n 15 lá»—i logic tiá»m áº©n, giáº£m thiá»ƒu tá»‘i Ä‘a hiá»‡n tÆ°á»£ng xung Ä‘á»™t code (Merge Conflicts) trÃªn nhÃ¡nh `main`.

---

### PHá»¤ Lá»¤C: CHECKLIST KIá»‚M TOÃN GÃ“I Báº°NG CHá»¨NG THá»°C Táº¾ (EVIDENCE CHECKLIST)

| STT | TÃªn Háº¡ng má»¥c Báº±ng chá»©ng | Äá»‹nh dáº¡ng File | Tráº¡ng thÃ¡i Kiá»ƒm toÃ¡n | ÄÆ°á»ng dáº«n / MÃ´ táº£ minh chá»©ng |
| :---: | :--- | :---: | :---: | :--- |
| **01** | BÃ¡o cÃ¡o Tá»•ng káº¿t Ká»¹ thuáº­t (Final Technical Report) | `.pdf` | **COMPLETED** | 7 chÆ°Æ¡ng chuáº©n, viáº¿t 100% thÃ¬ quÃ¡ khá»©, tÃ­ch há»£p Ä‘áº§y Ä‘á»§ káº¿t quáº£ UAT & Beta test. |
| **02** | Äiá»u lá»‡ Dá»± Ã¡n ÄÃ£ KÃ½ Duyá»‡t (Project Charter Signed) | `.pdf` | **COMPLETED** | Äá»§ 13 má»¥c chuáº©n hÃ³a PMBOK, cÃ³ chá»¯ kÃ½ cá»§a GV ChuyÃªn ngÃ nh, GV QLDA vÃ  PM. |
| **03** | CÆ¡ cáº¥u WBS & Tá»« Ä‘iá»ƒn WBS (WBS & Dictionary) | `.pdf` | **COMPLETED** | CÃ¢y WBS chuáº©n 100% Rule, 22 gÃ³i cÃ´ng viá»‡c 1â€“2 tuáº§n cÃ³ DoD chi tiáº¿t. |
| **04** | Báº£ng Theo dÃµi Rá»§i ro Tiáº¿n hÃ³a (Dynamic Risk Register) | `.xlsx` | **COMPLETED** | Ma tráº­n 5x5, tiáº¿n hÃ³a qua Sprint 1 (W06) vÃ  Sprint 2 (W11), 6 rá»§i ro chi tiáº¿t. |
| **05** | BiÃªn báº£n Há»p Sprint Retrospectives | `.pdf` | **COMPLETED** | BiÃªn báº£n Sprint 1 Retro vÃ  Final Retro theo mÃ´ hÃ¬nh 4Ls / Sailboat. |
| **06** | Há»“ sÆ¡ Xá»­ lÃ½ Thay Ä‘á»•i Pháº¡m vi (Approved CR Record) | `.pdf` | **COMPLETED** | Há»“ sÆ¡ CR-01 (Äá»•i Telemedicine láº¥y QR Check-in) cÃ³ chá»¯ kÃ½ phÃª duyá»‡t cá»§a CCB. |
| **07** | Bá»™ Slide Thuyáº¿t trÃ¬nh Báº£o vá»‡ Cuá»‘i ká»³ | `.pdf` | **COMPLETED** | 10 slides chuáº©n thiáº¿t káº¿ cho phiÃªn báº£o vá»‡ 16 phÃºt trÆ°á»›c Há»™i Ä‘á»“ng chuyÃªn mÃ´n. |

*(Ghi chÃº: Theo Ä‘Ãºng quy Ä‘á»‹nh Pathway 1 - Káº¿ thá»«a/Song hÃ nh Ä‘á»“ Ã¡n chuyÃªn ngÃ nh, khÃ´ng yÃªu cáº§u file sá»‘ 07 kÃ½ ngoÃ i doanh nghiá»‡p; toÃ n bá»™ káº¿t quáº£ nghiá»‡m thu UAT ngÆ°á»i dÃ¹ng vÃ  Ä‘Ã¡nh giÃ¡ cá»§a Giáº£ng viÃªn chuyÃªn ngÃ nh Ä‘Æ°á»£c tÃ­ch há»£p trá»±c tiáº¿p vÃ o BÃ¡o cÃ¡o ká»¹ thuáº­t sá»‘ 01).*

