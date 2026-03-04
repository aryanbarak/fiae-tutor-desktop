import { useEffect, useMemo, useState } from "react";
import { runTutorRaw } from "../../api/coreClient";
import { SessionHistory } from "../../features/examBankAp2/simulation/SessionHistory";
import { SimulationPage } from "../../features/examBankAp2/simulation/SimulationPage";
import { loadSessionHistory } from "../../features/examBankAp2/simulation/session";
import { ExamCategory, ExamDifficulty, ExamQuestion, SimulationSession } from "../../features/examBankAp2/simulation/types";
import { shuffleDeterministic } from "../../features/examBankAp2/simulation/rng";

const DIFFICULTY_OPTIONS: Array<ExamDifficulty> = ["easy", "medium", "hard"];

const BASE_SEED = 20260211;
const EXAM_BANK_REQUEST = {
  version: "1.0",
  request_id: "exam-bank-ap2-de-v1",
  topic: "exam_bank_ap2",
  mode: "trace",
  lang: "de" as const,
  params: {},
};

type ExamBankCoreEnvelope = {
  result?: unknown;
  error?: unknown;
};

type ExamBankResultPayload = {
  questions?: unknown;
  error?: unknown;
  supported_langs?: unknown;
  checked_paths?: unknown;
  lang?: unknown;
  mode?: unknown;
};

function extractExamBankPayload(parsed: ExamBankCoreEnvelope): ExamBankResultPayload {
  if (!parsed || typeof parsed !== "object") return {};
  const rootResult = (parsed as { result?: unknown }).result;
  if (!rootResult || typeof rootResult !== "object") return {};

  // Support both shapes:
  // 1) { result: { questions: [...] } }
  // 2) { result: { result: { questions: [...] } } }
  const rootPayload = rootResult as ExamBankResultPayload;
  if (Array.isArray(rootPayload.questions) || typeof rootPayload.error === "string") {
    return rootPayload;
  }
  const nested = (rootPayload as { result?: unknown }).result;
  if (nested && typeof nested === "object") {
    return nested as ExamBankResultPayload;
  }
  return rootPayload;
}

function buildPersianExplanation(question: ExamQuestion): string {
  const directFa =
    (question as { fa_explain?: unknown; explain_fa?: unknown }).fa_explain ??
    (question as { fa_explain?: unknown; explain_fa?: unknown }).explain_fa;
  if (typeof directFa === "string" && directFa.trim().length > 0) {
    return directFa.trim();
  }

  if (question.id === "s2222_2_2_1a_statistik_aus_array") {
    return `در این مسئله ورودی مصرف ماهانه نیست؛ ورودی قرائت‌های کنتور (Zählerstände) است.
بنابراین مصرف هر ماه باید این‌طور محاسبه شود:

مصرف ماه m = قرائت ماه m − قرائت ماه m−1

بعد از محاسبه‌ی همه‌ی مصرف‌های ماهانه برای همه‌ی مشترک‌ها:

یک min و max سراسری نگه می‌داریم و با هر مصرف ماهانه آن‌ها را به‌روزرسانی می‌کنیم.

هرجا مصرف ماهانه > limit بود، یک شیء Monatsverbrauch(شماره‌مشترک، شماره‌ماه، مقدارمصرف) به لیست اضافه می‌کنیم.

در پایان یک شیء Jahresstatistik(min, max, liste) برمی‌گردانیم.

دام‌های مهم:

اشتباه گرفتن «قرائت» با «مصرف» (اگر اختلاف نگیری، جواب غلط است).

خطای اندیس ماه‌ها (ماه 1 اختلاف بین عنصر 1 و 0 است).

استفاده از >= به جای > وقتی سؤال گفته “über einem Grenzwert”.`;
  }

  const text = `${question.id} ${question.question} ${question.answer_short} ${question.answer_long}`.toLowerCase();
  const has = (...parts: string[]) => parts.some((p) => text.includes(p));
  const topic =
    has("unit-test", "unit test", "regression", "refactoring", "isolier")
      ? `تست واحد یعنی بررسی یک بخش کوچک و مستقل از برنامه، معمولاً یک تابع یا متد، بدون وابستگی مستقیم به پایگاه‌داده واقعی، شبکه یا سرویس بیرونی.

نقش اصلی Unit-Test در چرخه توسعه این است که خطاها را در همان سطح منطق داخلی سریع پیدا کند. وقتی کد تغییر می‌کند، این تست‌ها کمک می‌کنند مطمئن شویم رفتار قبلی خراب نشده و Regression رخ نداده است.

تفاوت مهم با Integration-Test این است که در تست واحد فقط یک جزء ایزوله بررسی می‌شود، اما در تست یکپارچه تعامل چند جزء با هم سنجیده می‌شود. اگر این مرز رعایت نشود، تست‌ها کند و غیرقابل اعتماد می‌شوند.`
      : has("aequivalenz", "equivalenz", "äquivalenz", "aequivalenzklasse")
        ? `کلاس هم‌ارزی یعنی ورودی‌ها را به گروه‌هایی تقسیم کنیم که انتظار داریم رفتار برنامه در هر گروه مشابه باشد. هدف این است که با تعداد تست کمتر، پوشش مؤثر به دست آوریم.

در این نوع سؤال باید روشن کنید هر نمونه دقیقاً به کدام کلاس تعلق دارد و چرا. برای خروجی منفی یک، معمولاً کلاس‌های خطا مانند ورودی منفی یا ترتیب نامعتبر داده مطرح هستند.

خطای رایج این است که دو مثال از یک کلاس واحد داده شود یا نمونه‌ای نوشته شود که عملاً خروجی منفی یک نمی‌دهد. پاسخ خوب باید هم تعریف کلاس را شفاف کند، هم مثال عددی درست بدهد.`
        : has("trigger", "before", "after", "insert", "update", "delete")
          ? `تریگر یک منطق خودکار در پایگاه‌داده است که با رخدادهای INSERT، UPDATE یا DELETE فعال می‌شود. یعنی برنامه آن را مستقیم صدا نمی‌زند و اجرای آن رویدادمحور است.

اهمیت Trigger در این است که می‌تواند قوانین یکپارچگی، ثبت تغییرات و کنترل‌های حساس را نزدیک به داده اجرا کند. به این ترتیب وابستگی به لایه برنامه کمتر می‌شود و کنترل در خود DB متمرکز می‌ماند.

تریگر با Stored Procedure فرق دارد: Procedure معمولاً با فراخوانی صریح اجرا می‌شود، اما Trigger بر اساس رخداد جدول اجرا می‌شود.`
          : has("stored procedure", "prozedur", "call ")
            ? `Stored Procedure یک رویه ذخیره‌شده در پایگاه‌داده است که با CALL اجرا می‌شود. هدف آن این است که منطق تکراری و داده‌محور در یک نقطه متمرکز و قابل کنترل بماند.

از دید مهندسی، Procedure می‌تواند کارایی را بهتر کند چون رفت‌وبرگشت بین برنامه و DB را کم می‌کند و همچنین کنترل دسترسی و اعتبارسنجی را به‌صورت متمرکز انجام می‌دهد.

نکته مهم این است که Procedure با Trigger یکی نیست؛ Procedure اجرای صریح دارد، Trigger اجرای رویدادمحور.`
            : has("3nf", "normalform", "pk/fk", "kardinal", "er-modell")
              ? `هدف نرمال‌سازی تا 3NF این است که افزونگی داده و خطاهای درج، ویرایش و حذف کاهش پیدا کند. در 3NF هر ویژگی غیرکلیدی باید فقط به کلید اصلی همان جدول وابسته باشد.

در پاسخ خوب باید موجودیت‌ها جدا شوند، کلیدهای اصلی و خارجی دقیق تعریف شوند و کاردینالیتی رابطه‌ها درست مشخص شود. اگر داده زمانی یا تاریخچه دارید، معمولاً جدول میانی لازم می‌شود.

اشتباه رایج این است که چند مفهوم متفاوت در یک جدول ادغام شود یا داده تاریخی به‌صورت ستون ثابت ذخیره شود.`
              : has("index", "create index", "ddl")
                ? `ایندکس ساختاری کمکی برای افزایش سرعت جست‌وجو و فیلتر است. پایگاه‌داده به‌جای اسکن کامل جدول، از ایندکس برای دسترسی سریع‌تر استفاده می‌کند.

ایندکس روی ستون‌هایی ارزشمند است که در WHERE، JOIN یا ORDER BY زیاد استفاده می‌شوند. در مقابل، تعداد زیاد ایندکس می‌تواند عملیات نوشتن را کند کند چون هر تغییر داده باید ایندکس‌ها را هم به‌روزرسانی کند.

پس تحلیل درست یعنی ایجاد توازن بین سرعت خواندن و هزینه نوشتن.`
                : has("join", "group by", "sum", "urlaub", "tage")
                  ? `در این سؤال باید داده‌های چند جدول را با JOIN ترکیب کنید و سپس با GROUP BY و تابع‌هایی مثل SUM خروجی تجمیعی بسازید.

کلید اتصال باید دقیق انتخاب شود؛ چون اتصال اشتباه باعث کم‌شماری یا بیش‌شماری نتیجه می‌شود. کیفیت JOIN مستقیماً روی صحت گزارش نهایی اثر دارد.

پاسخ استاندارد باید مسیر داده، معیار گروه‌بندی و منطق تجمیع را شفاف و مرحله‌ای توضیح دهد.`
                  : has("archive", "delete", "loeschen", "löschen")
                    ? `در مسائل Archive/Delete هدف این است که حذف داده به‌صورت امن انجام شود و یکپارچگی سیستم از بین نرود. معمولاً ابتدا آرشیو و بعد حذف کنترل‌شده انجام می‌شود.

ترتیب عملیات اهمیت زیادی دارد؛ اگر حذف زود انجام شود، داده موردنیاز برای گزارش یا بازیابی از بین می‌رود. همچنین باید وابستگی‌های مرجع بررسی شوند تا داده یتیم ایجاد نشود.

پاسخ خوب باید معیار انتخاب رکوردهای حذف یا آرشیو را دقیق مشخص کند.`
                    : has("rekursion", "recursion", "binary", "dezimal", "iteration")
                      ? `این موضوع روی تبدیل عدد و انتخاب روش بازگشتی یا تکراری تمرکز دارد. در بازگشت، شرط توقف باید دقیق باشد تا خروجی ناقص یا اجرای بی‌پایان رخ ندهد.

در تبدیل ده‌دهی به دودویی، ترتیب تولید بیت‌ها نکته کلیدی است؛ چون مدیریت نادرست ترتیب می‌تواند نتیجه را معکوس یا اشتباه کند.

پاسخ تحلیلی باید علاوه بر روش حل، دلیل انتخاب روش و مدیریت حالت‌های مرزی را هم روشن کند.`
                      : has("comparator", "compare", "sort", "bubble", "insertion")
                        ? `در این سؤال موضوع اصلی معیار مقایسه و اثر آن روی مرتب‌سازی است. وقتی Comparator دقیق تعریف شود، الگوریتم برای انواع داده قابل استفاده و قابل توسعه می‌شود.

باید قرارداد مقایسه (کوچک‌تر، برابر، بزرگ‌تر) و جهت مرتب‌سازی روشن باشد. در الگوریتم‌های پایدار، رفتار حالت برابری اهمیت ویژه دارد.

پاسخ کامل باید منطق مقایسه، شرط جابه‌جایی و خطاهای رایج در تعریف Comparator را توضیح دهد.`
                        : has("verbrauch", "statistik", "array", "min", "max", "limit")
                          ? `در این نوع مسئله باید یک پیمایش منظم روی داده انجام دهید تا هم‌زمان چند خروجی مثل کمینه، بیشینه و موارد عبور از آستانه تولید شود.

اگر داده دوره‌ای است، تفسیر صحیح ستون‌ها و نحوه محاسبه اختلاف یا مصرف بسیار مهم است؛ چون اشتباه در همین نقطه کل نتیجه را منحرف می‌کند.

پاسخ مناسب علاوه بر منطق اصلی، حالت‌های مرزی مثل داده خالی، مقدار اولیه متغیرها و شرط دقیق مقایسه با آستانه را هم پوشش می‌دهد.`
                          : `در این سؤال باید مفهوم اصلی موضوع را دقیق روشن کنید، سپس منطق حل را مرحله‌به‌مرحله توضیح دهید و در پایان نشان دهید خروجی چگونه از ورودی به‌دست می‌آید.

پاسخ استاندارد فقط تعریف نیست؛ باید کاربرد عملی مفهوم، ارتباط آن با مفاهیم نزدیک و خطاهای رایج نیز مشخص شود.

اگر پاسخ شما این سه بخش را شفاف پوشش دهد، هم از نظر مفهومی قوی است و هم در فضای امتحان قابل اتکا خواهد بود.`;

  return topic;
}

function looksLikePseudocodeBlock(block: string): boolean {
  const lines = block.split("\n").map((line) => line.trim()).filter(Boolean);
  if (lines.length < 3) return false;
  const joined = lines.join(" ").toUpperCase();
  const hints = ["FUNKTION", "PROZEDUR", "FUER", "SOLANGE", "WENN", "ENDE", "GIB", "DANN"];
  const score = hints.reduce((acc, token) => acc + (joined.includes(token) ? 1 : 0), 0);
  return score >= 2;
}


export function ExamBankPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);

  const [categoryFilter, setCategoryFilter] = useState<"all" | ExamCategory>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<"all" | ExamDifficulty>("all");
  const [searchText, setSearchText] = useState("");

  const [tab, setTab] = useState<"browse" | "quiz" | "simulation" | "history">("browse");
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizReveal, setQuizReveal] = useState(false);
  const [shuffleEnabled, setShuffleEnabled] = useState(false);
  const [shuffleSeed, setShuffleSeed] = useState(BASE_SEED);
  const [seedStep, setSeedStep] = useState(1);
  const [history, setHistory] = useState<SimulationSession[]>([]);
  const [replaySession, setReplaySession] = useState<SimulationSession | null>(null);

  const loadQuestions = async () => {
    setLoading(true);
    setError(null);
    try {
      const request = {
        ...EXAM_BANK_REQUEST,
        lang: "de" as const,
      };
      const raw = await runTutorRaw(request);
      const parsed = JSON.parse(raw) as ExamBankCoreEnvelope;
      const payload = extractExamBankPayload(parsed);
      const resultQuestions = payload.questions;

      if (!Array.isArray(resultQuestions)) {
        throw new Error("Invalid exam bank response: result.questions missing");
      }

      const coreError = typeof payload.error === "string" ? payload.error.trim() : "";
      if (resultQuestions.length === 0 && coreError) {
        const supportedLangs = Array.isArray(payload.supported_langs)
          ? payload.supported_langs.join(", ")
          : "";
        const checkedPaths =
          payload.checked_paths && typeof payload.checked_paths === "object"
            ? JSON.stringify(payload.checked_paths)
            : "";
        throw new Error(
          [
            coreError,
            supportedLangs ? `supported_langs=${supportedLangs}` : "",
            checkedPaths ? `checked_paths=${checkedPaths}` : "",
          ]
            .filter(Boolean)
            .join(" | "),
        );
      }

      const normalizedQuestions = (resultQuestions as Array<Record<string, unknown>>).map((q) => {
        const questionText =
          typeof q.question === "string"
            ? q.question
            : typeof q.prompt === "string"
              ? q.prompt
              : "";
        return {
          ...q,
          question: questionText,
          keywords: Array.isArray(q.keywords) ? q.keywords : [],
          traps: Array.isArray(q.traps) ? q.traps : [],
        } as ExamQuestion;
      });

      setQuestions(normalizedQuestions);
      setQuizIndex(0);
      setQuizReveal(false);
      setExpandedIds({});
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadQuestions();
    setHistory(loadSessionHistory());
  }, []);

  useEffect(() => {
    if (tab === "history") {
      setHistory(loadSessionHistory());
    }
  }, [tab]);

  const filteredQuestions = useMemo(() => {
    return questions.filter((q) => {
      if (categoryFilter !== "all" && q.category !== categoryFilter) return false;
      if (difficultyFilter !== "all" && q.difficulty !== difficultyFilter) return false;
      if (searchText.trim()) {
        const hay = q.question.toLowerCase();
        const needle = searchText.trim().toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });
  }, [categoryFilter, difficultyFilter, questions, searchText]);

  const quizQuestions = useMemo(() => {
    if (!shuffleEnabled) return filteredQuestions;
    return shuffleDeterministic(filteredQuestions, shuffleSeed);
  }, [filteredQuestions, shuffleEnabled, shuffleSeed]);

  useEffect(() => {
    if (quizQuestions.length === 0) {
      setQuizIndex(0);
      setQuizReveal(false);
      return;
    }
    if (quizIndex >= quizQuestions.length) {
      setQuizIndex(quizQuestions.length - 1);
    }
  }, [quizIndex, quizQuestions]);

  useEffect(() => {
    setQuizReveal(false);
  }, [quizIndex, tab]);

  useEffect(() => {
    if (tab !== "quiz") return;
    const onKey = (event: KeyboardEvent) => {
      const key = event.key.toLowerCase();
      if (key === "n") {
        event.preventDefault();
        setQuizIndex((idx) => Math.min(idx + 1, Math.max(0, quizQuestions.length - 1)));
      } else if (key === "p") {
        event.preventDefault();
        setQuizIndex((idx) => Math.max(0, idx - 1));
      } else if (key === "r") {
        event.preventDefault();
        setQuizReveal((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [quizQuestions.length, tab]);

  const currentQuizQuestion = quizQuestions[quizIndex];

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const q of filteredQuestions) {
      counts[q.category] = (counts[q.category] || 0) + 1;
    }
    return counts;
  }, [filteredQuestions]);

  const categoryOptions = useMemo(() => {
    return Array.from(new Set(questions.map((q) => q.category))).sort((a, b) => a.localeCompare(b));
  }, [questions]);

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const exportPdf = () => {
    const items = filteredQuestions;
    if (items.length === 0) {
      window.alert("No questions to export for current filters.");
      return;
    }

    const escapeHtml = (value: string | undefined) =>
      (value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const toBlocks = (value: string | undefined) =>
      escapeHtml(value)
        .split(/\n{2,}/)
        .map((part: string) => part.trim())
        .filter((part: string) => part.length > 0)
        .map((part: string) => `<p>${part.replace(/\n/g, "<br/>")}</p>`)
        .join("");

    const toDetailedHtml = (question: ExamQuestion) => {
      const longAnswer = question.answer_long?.trim() ?? "";
      const pseudoRaw = (question as { pseudocode?: unknown }).pseudocode;
      const pseudocode = typeof pseudoRaw === "string" ? pseudoRaw.trim() : "";
      const blocks = longAnswer
        ? longAnswer.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 0)
        : [];

      const rendered = blocks
        .map((block) =>
          looksLikePseudocodeBlock(block)
            ? `<pre class="code">${escapeHtml(block)}</pre>`
            : `<p>${escapeHtml(block).replace(/\n/g, "<br/>")}</p>`,
        )
        .join("");

      const pseudoSection = pseudocode.length > 0 ? `<pre class="code">${escapeHtml(pseudocode)}</pre>` : "";
      return `${rendered}${pseudoSection}`;
    };

    const renderedQuestions = items
      .map((q, index) => {
        const officialQuestionText = q.official_question_text?.trim() ?? "";
        const officialAnswerText = q.official_answer_text?.trim() ?? "";
        const hasOfficialText = officialQuestionText.length > 0 || officialAnswerText.length > 0;
        const persian = buildPersianExplanation(q);

        return `
          <section class="question">
            <div class="meta">
              <span class="chip">${escapeHtml(q.category)}</span>
              <span class="chip">${escapeHtml(q.difficulty)}</span>
              <span class="qid">${escapeHtml(q.id)}</span>
            </div>
            <h2>Question ${index + 1}</h2>
            <div class="prompt">${toBlocks(q.question)}</div>

            <div class="box answer">
              <h3>Answer (Short)</h3>
              ${toBlocks(q.answer_short)}
              <h3>Answer (Detailed)</h3>
              ${toDetailedHtml(q)}
            </div>

            <div class="box keywords">
              <h3>Keywords</h3>
              <div class="chips">
                ${q.keywords.map((kw) => `<span class="chip">${escapeHtml(kw)}</span>`).join("")}
              </div>
            </div>

            <div class="box official">
              <h3>Official Text (User Provided)</h3>
              ${
                hasOfficialText
                  ? `
                    ${
                      officialQuestionText
                        ? `<div class="official-block"><strong>Question</strong>${toBlocks(officialQuestionText)}</div>`
                        : ""
                    }
                    ${
                      officialAnswerText
                        ? `<div class="official-block"><strong>Answer</strong>${toBlocks(officialAnswerText)}</div>`
                        : ""
                    }
                  `
                  : "<p>No official text provided yet.</p>"
              }
            </div>

            <div class="box fa" dir="rtl">
              <h3>توضیح فارسی</h3>
              ${toBlocks(persian)}
            </div>
          </section>
        `;
      })
      .join("");

    const html = `<!doctype html>
<html lang="de">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Exam Bank Export</title>
    <style>
      @page { size: A4; margin: 14mm; }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        color: #0b1220;
        font-family: "Segoe UI", Tahoma, Arial, sans-serif;
        font-size: 12pt;
        line-height: 1.55;
      }
      .header {
        margin-bottom: 12px;
        padding-bottom: 10px;
        border-bottom: 1px solid #cbd5e1;
      }
      .header h1 { margin: 0 0 4px 0; font-size: 18pt; }
      .header .meta { color: #334155; font-size: 10pt; }
      .question {
        page-break-after: always;
        break-after: page;
        padding-top: 6px;
      }
      .question:last-child {
        page-break-after: auto;
        break-after: auto;
      }
      .meta {
        display: flex;
        align-items: center;
        gap: 6px;
        flex-wrap: wrap;
        margin-bottom: 8px;
      }
      .chip {
        display: inline-block;
        border: 1px solid #94a3b8;
        border-radius: 999px;
        padding: 1px 8px;
        font-size: 9pt;
      }
      .qid { margin-left: auto; font-size: 9pt; color: #334155; }
      h2 { margin: 8px 0; font-size: 14pt; }
      h3 { margin: 0 0 6px 0; font-size: 11pt; }
      p { margin: 0 0 8px 0; }
      .prompt { margin-bottom: 10px; }
      .box {
        border: 1px solid #cbd5e1;
        border-radius: 8px;
        padding: 8px 10px;
        margin-bottom: 8px;
      }
      .answer { background: #f8fafc; }
      .answer .code {
        margin: 0 0 8px 0;
        border: 1px solid #cbd5e1;
        border-radius: 6px;
        background: #f1f5f9;
        padding: 8px;
        white-space: pre-wrap;
        overflow-wrap: anywhere;
        font-size: 10.5pt;
        line-height: 1.45;
        font-family: Consolas, "Courier New", monospace;
      }
      .keywords { background: #f9fafb; }
      .official { background: #fffbeb; }
      .official-block { margin-top: 6px; }
      .fa {
        background: #fffbeb;
        border-color: #f59e0b;
        font-family: "Vazirmatn", "IRANSansX", Tahoma, "Segoe UI", sans-serif;
        direction: rtl;
        text-align: right;
      }
      .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
      }
      @media print {
        a { color: inherit; text-decoration: none; }
      }
    </style>
  </head>
  <body>
    <header class="header">
      <h1>Exam Bank (AP2) Export</h1>
      <div class="meta">Generated: ${new Date().toISOString()} | Questions: ${items.length}</div>
      <div class="meta">Category filter: ${escapeHtml(categoryFilter)} | Difficulty filter: ${escapeHtml(difficultyFilter)}</div>
    </header>
    ${renderedQuestions}
  </body>
</html>`;

    const frame = document.createElement("iframe");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";
    frame.setAttribute("aria-hidden", "true");
    document.body.appendChild(frame);

    const frameDoc = frame.contentDocument;
    const frameWin = frame.contentWindow;
    if (!frameDoc || !frameWin) {
      document.body.removeChild(frame);
      window.alert("Could not initialize print frame.");
      return;
    }

    frame.onload = () => {
      frameWin.focus();
      frameWin.print();
      window.setTimeout(() => {
        if (document.body.contains(frame)) {
          document.body.removeChild(frame);
        }
      }, 1200);
    };

    frameDoc.open();
    frameDoc.write(html);
    frameDoc.close();
  };

  const renderLongAnswer = (question: ExamQuestion) => {
    const longAnswer = question.answer_long?.trim();
    const pseudoRaw = (question as { pseudocode?: unknown }).pseudocode;
    const pseudocode = typeof pseudoRaw === "string" ? pseudoRaw.trim() : "";
    if (!longAnswer && !pseudocode) return null;

    const textBlocks = longAnswer
      ? longAnswer.split(/\n{2,}/).map((b) => b.trim()).filter((b) => b.length > 0)
      : [];

    return (
      <div style={styles.answerLongText}>
        {textBlocks.map((block, idx) =>
          looksLikePseudocodeBlock(block) ? (
            <pre key={`code-${idx}`} style={styles.pseudocodeBlock}>{block}</pre>
          ) : (
            <div key={`text-${idx}`} style={styles.answerParagraph}>{block}</div>
          ),
        )}
        {pseudocode && <pre style={styles.pseudocodeBlock}>{pseudocode}</pre>}
      </div>
    );
  };

  const renderPersianExplanation = (question: ExamQuestion) => (
    <div style={styles.faPanel}>
      <strong>توضیح فارسی</strong>
      <div style={styles.faText}>{buildPersianExplanation(question)}</div>
    </div>
  );

  const renderOfficialText = (question: ExamQuestion) => {
    const officialQuestionText = question.official_question_text?.trim() ?? "";
    const officialAnswerText = question.official_answer_text?.trim() ?? "";
    const hasOfficialText = officialQuestionText.length > 0 || officialAnswerText.length > 0;

    return (
      <div style={styles.officialPanel}>
        <strong>Official Text (User Provided)</strong>
        {!hasOfficialText ? (
          <div style={styles.officialEmpty}>No official text provided yet.</div>
        ) : (
          <>
            {officialQuestionText && (
              <div style={styles.officialBlock}>
                <div style={styles.officialLabel}>Question</div>
                <div style={styles.officialText}>{officialQuestionText}</div>
              </div>
            )}
            {officialAnswerText && (
              <div style={styles.officialBlock}>
                <div style={styles.officialLabel}>Answer</div>
                <div style={styles.officialText}>{officialAnswerText}</div>
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const bumpSeedDeterministically = () => {
    setShuffleSeed((prev) => ((prev + seedStep * 7919) >>> 0) || BASE_SEED);
    setSeedStep((prev) => prev + 1);
  };

  const renderBrowse = () => (
    <div style={styles.list}>
      {filteredQuestions.map((q) => {
        const expanded = !!expandedIds[q.id];
        return (
          <div key={q.id} style={styles.card}>
            <div style={styles.metaRow}>
              <span style={styles.badge}>{q.category}</span>
              <span style={styles.badge}>{q.difficulty}</span>
              <span style={styles.idText}>{q.id}</span>
            </div>
            <div style={styles.questionText}>{q.question}</div>
            <button type="button" style={styles.secondaryBtn} onClick={() => toggleExpanded(q.id)}>
              {expanded ? "Hide answer" : "Show answer"}
            </button>
            {expanded && (
              <div style={styles.answerPanel}>
                <div style={styles.answerText}>{q.answer_short}</div>
                {renderLongAnswer(q)}
                <div style={styles.keywordsRow}>
                  {q.keywords.map((kw) => (
                    <span key={kw} style={styles.keywordChip}>
                      {kw}
                    </span>
                  ))}
                </div>
                {renderOfficialText(q)}
                {renderPersianExplanation(q)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );

  const renderQuiz = () => (
    <div style={styles.panel}>
      <div style={styles.quizControls}>
        <label style={styles.checkboxLabel}>
          <input
            type="checkbox"
            checked={shuffleEnabled}
            onChange={(e) => setShuffleEnabled(e.target.checked)}
          />
          Shuffle (seeded)
        </label>
        <span style={styles.seedBox}>Seed: {shuffleSeed}</span>
        <button type="button" style={styles.secondaryBtn} onClick={bumpSeedDeterministically}>
          New seed
        </button>
      </div>
      {quizQuestions.length === 0 ? (
        <div>No questions for current filter.</div>
      ) : (
        <>
          <div style={styles.progress}>
            {quizIndex + 1} / {quizQuestions.length}
          </div>
          <div style={styles.metaRow}>
            <span style={styles.badge}>{currentQuizQuestion.category}</span>
            <span style={styles.badge}>{currentQuizQuestion.difficulty}</span>
            <span style={styles.idText}>{currentQuizQuestion.id}</span>
          </div>
          <div style={styles.questionText}>{currentQuizQuestion.question}</div>
          <div style={styles.quizButtons}>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setQuizIndex((idx) => Math.max(0, idx - 1))}
            >
              Previous
            </button>
            <button type="button" style={styles.primaryBtn} onClick={() => setQuizReveal((v) => !v)}>
              {quizReveal ? "Hide" : "Reveal"}
            </button>
            <button
              type="button"
              style={styles.secondaryBtn}
              onClick={() => setQuizIndex((idx) => Math.min(quizQuestions.length - 1, idx + 1))}
            >
              Next
            </button>
          </div>
          {quizReveal && (
            <div style={styles.answerPanel}>
              <div style={styles.answerText}>{currentQuizQuestion.answer_short}</div>
              {renderLongAnswer(currentQuizQuestion)}
              <div style={styles.keywordsRow}>
                {currentQuizQuestion.keywords.map((kw) => (
                  <span key={kw} style={styles.keywordChip}>
                    {kw}
                  </span>
                ))}
              </div>
              {renderOfficialText(currentQuizQuestion)}
              {renderPersianExplanation(currentQuizQuestion)}
            </div>
          )}
        </>
      )}
    </div>
  );

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <h2 style={styles.title}>Exam Bank (AP2)</h2>
        <div style={styles.headerActions}>
          <button
            type="button"
            onClick={exportPdf}
            style={styles.secondaryBtn}
            disabled={loading || filteredQuestions.length === 0}
            title="Export currently filtered questions to printable PDF"
          >
            Export PDF
          </button>
          <button type="button" onClick={() => void loadQuestions()} style={styles.secondaryBtn}>
            Reload
          </button>
        </div>
      </div>

      <div style={styles.filterRow}>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as "all" | ExamCategory)}
          style={styles.select}
        >
          <option value="all">Category: All</option>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={difficultyFilter}
          onChange={(e) => setDifficultyFilter(e.target.value as "all" | ExamDifficulty)}
          style={styles.select}
        >
          <option value="all">Difficulty: All</option>
          {DIFFICULTY_OPTIONS.map((difficulty) => (
            <option key={difficulty} value={difficulty}>
              {difficulty}
            </option>
          ))}
        </select>

        <input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Search question text"
          style={styles.searchInput}
        />
      </div>

      <div style={styles.infoRow}>
        <span>
          Showing {filteredQuestions.length} / {questions.length}
        </span>
        <span style={styles.counts}>
          {categoryOptions.map((category) => (
            <span key={category} style={styles.countBadge}>
              {category}:{categoryCounts[category] || 0}
            </span>
          ))}
        </span>
      </div>

      <div style={styles.modeRow}>
        <button type="button" style={{ ...styles.modeBtn, ...(tab === "browse" ? styles.modeBtnActive : {}) }} onClick={() => setTab("browse")}>
          Browse
        </button>
        <button type="button" style={{ ...styles.modeBtn, ...(tab === "quiz" ? styles.modeBtnActive : {}) }} onClick={() => setTab("quiz")}>
          Quiz
        </button>
        <button type="button" style={{ ...styles.modeBtn, ...(tab === "simulation" ? styles.modeBtnActive : {}) }} onClick={() => setTab("simulation")}>
          Simulation
        </button>
        <button type="button" style={{ ...styles.modeBtn, ...(tab === "history" ? styles.modeBtnActive : {}) }} onClick={() => setTab("history")}>
          History
        </button>
      </div>

      {loading && <div style={styles.panel}>Loading exam bank...</div>}
      {error && !loading && <div style={styles.errorPanel}>Error: {error}</div>}
      {!loading && !error && tab === "browse" && renderBrowse()}
      {!loading && !error && tab === "quiz" && renderQuiz()}
      {!loading && !error && tab === "simulation" && (
        <SimulationPage
          questions={filteredQuestions}
          replaySession={replaySession}
          onReplayConsumed={() => setReplaySession(null)}
          onReplayFromHistory={(session) => {
            setReplaySession(session);
            setTab("simulation");
          }}
        />
      )}
      {!loading && !error && tab === "history" && (
        <SessionHistory
          sessions={history}
          onReplay={(session) => {
            setReplaySession(session);
            setTab("simulation");
          }}
        />
      )}
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#05070b",
    color: "#d7e0ee",
    padding: "1rem",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "0.75rem",
  },
  headerActions: {
    display: "flex",
    gap: "0.5rem",
    alignItems: "center",
  },
  title: {
    margin: 0,
    color: "#9ceab6",
  },
  filterRow: {
    display: "flex",
    gap: "0.5rem",
    flexWrap: "wrap" as const,
    marginBottom: "0.5rem",
  },
  select: {
    padding: "0.45rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid #334455",
    background: "#111925",
    color: "#d7e0ee",
  },
  searchInput: {
    padding: "0.45rem 0.6rem",
    borderRadius: "6px",
    border: "1px solid #334455",
    background: "#111925",
    color: "#d7e0ee",
    minWidth: "260px",
  },
  infoRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.5rem",
    flexWrap: "wrap" as const,
    fontSize: "13px",
  },
  counts: {
    display: "flex",
    gap: "0.3rem",
    flexWrap: "wrap" as const,
  },
  countBadge: {
    padding: "0.18rem 0.4rem",
    borderRadius: "999px",
    background: "#1a2739",
    border: "1px solid #385475",
    fontSize: "11px",
  },
  modeRow: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "0.5rem",
    flexWrap: "wrap" as const,
  },
  modeBtn: {
    padding: "0.45rem 0.8rem",
    borderRadius: "6px",
    border: "1px solid #2f3e51",
    background: "#111925",
    color: "#c8d3e3",
    cursor: "pointer" as const,
  },
  modeBtnActive: {
    borderColor: "#6fa5e5",
    background: "#17253a",
  },
  panel: {
    border: "1px solid #233447",
    borderRadius: "8px",
    background: "#0c141f",
    padding: "0.9rem",
  },
  errorPanel: {
    border: "1px solid #8d3d4a",
    borderRadius: "8px",
    background: "#2b1117",
    color: "#ffc5ce",
    padding: "0.9rem",
  },
  list: {
    display: "grid",
    gap: "0.7rem",
  },
  card: {
    border: "1px solid #24384d",
    borderRadius: "8px",
    background: "#0c141f",
    padding: "0.85rem",
    display: "grid",
    gap: "0.55rem",
  },
  metaRow: {
    display: "flex",
    gap: "0.4rem",
    alignItems: "center",
    flexWrap: "wrap" as const,
  },
  badge: {
    padding: "0.12rem 0.45rem",
    borderRadius: "999px",
    background: "#1a2739",
    border: "1px solid #3d5b7f",
    fontSize: "11px",
  },
  idText: {
    marginLeft: "auto",
    fontSize: "11px",
    opacity: 0.8,
  },
  questionText: {
    fontSize: "15px",
    lineHeight: 1.45,
  },
  answerPanel: {
    border: "1px solid #315c3f",
    background: "#102016",
    borderRadius: "8px",
    padding: "0.65rem",
    display: "grid",
    gap: "0.45rem",
  },
  answerText: {
    lineHeight: 1.45,
  },
  answerLongText: {
    lineHeight: 1.45,
    border: "1px solid #2f4f3a",
    background: "#0d1a13",
    borderRadius: "6px",
    padding: "0.55rem",
    fontSize: "14px",
  },
  answerParagraph: {
    whiteSpace: "pre-wrap" as const,
    lineHeight: 1.5,
    marginBottom: "0.45rem",
  },
  pseudocodeBlock: {
    border: "1px solid #3c5f4a",
    background: "#0a1510",
    borderRadius: "6px",
    padding: "0.65rem",
    marginBottom: "0.45rem",
    whiteSpace: "pre-wrap" as const,
    overflowX: "auto" as const,
    lineHeight: 1.5,
    fontSize: "13px",
    fontFamily: "Consolas, 'Courier New', monospace",
  },
  keywordsRow: {
    display: "flex",
    gap: "0.35rem",
    flexWrap: "wrap" as const,
  },
  keywordChip: {
    padding: "0.12rem 0.45rem",
    borderRadius: "999px",
    background: "#1f2d22",
    border: "1px solid #4a7854",
    fontSize: "11px",
  },
  officialPanel: {
    border: "1px solid #5b4a2f",
    background: "#1b1710",
    borderRadius: "6px",
    padding: "0.5rem",
    color: "#efddb9",
    display: "grid",
    gap: "0.35rem",
  },
  officialEmpty: {
    opacity: 0.8,
    fontSize: "13px",
  },
  officialBlock: {
    border: "1px solid #4f432d",
    borderRadius: "6px",
    background: "#151109",
    padding: "0.45rem",
    display: "grid",
    gap: "0.25rem",
  },
  officialLabel: {
    fontSize: "12px",
    opacity: 0.85,
  },
  officialText: {
    whiteSpace: "pre-wrap" as const,
    lineHeight: 1.5,
    fontSize: "14px",
  },
  faPanel: {
    border: "1px solid #8f7540",
    background: "#2b2212",
    borderRadius: "6px",
    padding: "0.5rem",
    color: "#ffdba0",
    direction: "rtl" as const,
    textAlign: "right" as const,
  },
  faText: {
    marginTop: "0.35rem",
    lineHeight: 1.95,
    fontSize: "18px",
    fontFamily: "'Vazirmatn', 'IRANSansX', Tahoma, 'Segoe UI', sans-serif",
    letterSpacing: "0",
    whiteSpace: "pre-wrap" as const,
  },
  quizControls: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    marginBottom: "0.6rem",
    flexWrap: "wrap" as const,
  },
  checkboxLabel: {
    display: "inline-flex",
    alignItems: "center",
    gap: "0.35rem",
    fontSize: "13px",
  },
  seedBox: {
    border: "1px solid #3a5679",
    background: "#122035",
    padding: "0.2rem 0.45rem",
    borderRadius: "6px",
    fontSize: "12px",
  },
  progress: {
    fontSize: "13px",
    marginBottom: "0.5rem",
    color: "#b9cae0",
  },
  quizButtons: {
    display: "flex",
    gap: "0.5rem",
    marginTop: "0.45rem",
  },
  primaryBtn: {
    padding: "0.45rem 0.85rem",
    borderRadius: "6px",
    border: "1px solid #2f5c8f",
    background: "#1b3a5c",
    color: "#d9ecff",
    cursor: "pointer" as const,
  },
  secondaryBtn: {
    padding: "0.45rem 0.85rem",
    borderRadius: "6px",
    border: "1px solid #3f536a",
    background: "#1a2230",
    color: "#d7e0ee",
    cursor: "pointer" as const,
  },
};
