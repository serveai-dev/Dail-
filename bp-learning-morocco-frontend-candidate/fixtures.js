import { DEFAULT_COURSE_KEY, courseKey } from "./course.js";

export const CONTENT = Object.freeze({ fr: {
  course: {
    eyebrow: "Communication en pharmacie",
    title: "Mieux accueillir et expliquer en pharmacie",
    description:
      "Entraînez-vous à demander la langue préférée, expliquer une étape à la fois et vérifier la compréhension avec respect.",
    duration: "15 minutes",
    level: "Fondamentaux",
  },
  preparation: [
    {
      id: "langue",
      title: "Demander la langue préférée",
      body: "Proposer un français simple ou une explication orale en darija, sans supposer la préférence de la personne.",
    },
    {
      id: "expliquer",
      title: "Expliquer simplement",
      body: "Présenter une étape à la fois, éviter le jargon et utiliser un exemple concret du quotidien.",
    },
    {
      id: "comprendre",
      title: "Vérifier la compréhension",
      body: "Inviter la personne à reformuler, accueillir ses questions et noter clairement la prochaine étape.",
    },
  ],
  scenario: {
    initials: "CF",
    customer: "Cliente fictive · Casablanca",
    context: "Une cliente souhaite comprendre des consignes générales affichées dans l’espace conseil. Elle lit le français, mais préfère parfois une explication orale en darija.",
    goal: "Demandez sa préférence, expliquez par étapes et vérifiez ce qu’elle a compris, sans formuler de conseil clinique.",
  },
  dialogue: [
    {
      speaker: "customer",
      text: "Je lis le français, mais je comprends mieux certaines explications en darija. Est-ce possible ?",
      choices: [
        "Bien sûr. Préférez-vous que nous commencions en français simple ou par une explication orale en darija ?",
        "Tout est déjà écrit en français sur l’affiche.",
        "Je vais choisir la langue pour aller plus vite.",
      ],
      best: 0,
      feedback: "La question laisse la personne choisir la langue qui lui convient.",
      reactions: { good: "Oui, en français simple, ça me va très bien.", almost: "Euh… je ne sais pas trop quoi répondre." },
    },
    {
      speaker: "customer",
      text: "Commençons en français simple. Je n’ai pas bien compris les trois étapes indiquées.",
      choices: [
        "D’accord. Regardons d’abord la première étape, puis vous me direz comment vous la comprenez.",
        "Je vais relire les trois étapes plus lentement, sans changer les mots.",
        "Ce document est pourtant très clair pour la plupart des personnes.",
      ],
      best: 0,
      feedback: "Une seule étape réduit la charge et rend la compréhension observable.",
      reactions: { good: "D'accord, une étape à la fois, c'est plus clair.", almost: "Ah… je me sens un peu bête, du coup." },
    },
    {
      speaker: "customer",
      text: "J’ai compris la première étape. Je dois aussi l’expliquer à ma mère à la maison.",
      choices: [
        "Je peux vous remettre un résumé très court. Pour toute question de santé précise, adressez-vous à un pharmacien.",
        "Mémorisez simplement tout ce que je viens de dire.",
        "Je ne peux rien faire si elle n’est pas présente.",
      ],
      best: 0,
      feedback: "Le résumé soutient la transmission et la limite professionnelle reste claire.",
      reactions: { good: "Merci, un petit résumé m'aidera pour ma mère.", almost: "Je ne suis pas sûre de pouvoir lui réexpliquer." },
    },
  ],
  modules: [
    {
      id: "preference",
      title: "Préférence linguistique",
      label: "Accueil",
      description: "Demandez une préférence sans déduire la maîtrise ou le niveau de lecture.",
      question: "Quelle question laisse réellement le choix ?",
      answers: ["Préférez-vous le français simple ou une explication orale en darija ?", "Vous parlez sûrement darija, n’est-ce pas ?", "Vous savez lire le français ?"],
      correct: 0,
      explanation: "Poser la question laisse la personne choisir. Supposer sa langue ou son niveau de lecture peut la gêner.",
    },
    {
      id: "structure",
      title: "Structurer l’explication",
      label: "Clarté",
      description: "Découpez l’information et donnez un repère visible pour chaque étape.",
      question: "Quelle séquence aide le mieux à suivre ?",
      answers: ["Une étape · reformulation · étape suivante", "Tout le contenu · question à la fin", "Jargon · répétition · conclusion"],
      correct: 0,
      explanation: "Une étape, puis une reformulation, puis l'étape suivante. La personne peut suivre et vous voyez ce qu'elle a compris.",
    },
    {
      id: "verification",
      title: "Vérifier sans juger",
      label: "Compréhension",
      description: "Utilisez la reformulation pour vérifier l’explication, pas pour tester la personne.",
      question: "Quelle formulation respecte la personne ?",
      answers: ["Pour vérifier si j’ai été clair, comment résumeriez-vous la première étape ?", "Répétez exactement ce que je viens de dire.", "Vous avez compris, oui ou non ?"],
      correct: 0,
      explanation: "Demander comment la personne résumerait l'étape vérifie votre explication, pas la personne. Les autres formulations la mettent à l'épreuve.",
    },
  ],
}, ar: {
  course: {
    eyebrow: "التواصل في الصيدلية",
    title: "استقبال أفضل وشرح أوضح في الصيدلية",
    description:
      "تدرّب على سؤال الزبونة عن اللغة التي تفضلها، وشرح كل خطوة على حدة، والتحقق من الفهم باحترام.",
    duration: "15 دقيقة",
    level: "أساسيات",
  },
  preparation: [
    {
      id: "langue",
      title: "سؤال الزبونة عن اللغة المفضلة",
      body: "اقترح فرنسية بسيطة أو شرحًا شفهيًا بالدارجة، من دون افتراض تفضيل الشخص.",
    },
    {
      id: "expliquer",
      title: "الشرح ببساطة",
      body: "اعرض خطوة واحدة في كل مرة، وتجنب المصطلحات الصعبة، واستخدم مثالًا من الحياة اليومية.",
    },
    {
      id: "comprendre",
      title: "التحقق من الفهم",
      body: "اطلب من الشخص إعادة الصياغة، ورحّب بأسئلته، وحدد الخطوة التالية بوضوح.",
    },
  ],
  scenario: {
    initials: "CF",
    customer: "زبونة افتراضية · الدار البيضاء",
    context: "ترغب زبونة في فهم تعليمات عامة معروضة في فضاء الاستشارة. تقرأ الفرنسية، لكنها تفضل أحيانًا شرحًا شفهيًا بالدارجة.",
    goal: "اسألها عن تفضيلها، واشرح على مراحل، وتحقق مما فهمته، من دون تقديم نصيحة سريرية.",
  },
  dialogue: [
    {
      speaker: "customer",
      text: "أقرأ الفرنسية، لكنني أفهم بعض الشروحات بشكل أفضل بالدارجة. هل هذا ممكن؟",
      choices: [
        "بالطبع. هل تفضلين أن نبدأ بفرنسية بسيطة أم بشرح شفهي بالدارجة؟",
        "كل شيء مكتوب بالفرنسية على الملصق.",
        "سأختار اللغة حتى ننتهي بسرعة.",
      ],
      best: 0,
      feedback: "يتيح السؤال للزبونة اختيار اللغة المناسبة لها.",
      reactions: { good: "نعم، الفرنسية البسيطة تناسبني جيدًا.", almost: "حسنًا… لا أعرف حقًا ماذا أجيب." },
    },
    {
      speaker: "customer",
      text: "لنبدأ بفرنسية بسيطة. لم أفهم جيدًا الخطوات الثلاث المذكورة.",
      choices: [
        "حسنًا. لننظر أولًا في الخطوة الأولى، ثم أخبريني كيف فهمتها.",
        "سأعيد قراءة الخطوات الثلاث ببطء أكبر، من دون تغيير الكلمات.",
        "هذه الوثيقة واضحة جدًا لمعظم الناس.",
      ],
      best: 0,
      feedback: "يساعد عرض خطوة واحدة على تقليل العبء وملاحظة الفهم.",
      reactions: { good: "حسنًا، خطوة واحدة في كل مرة أوضح لي.", almost: "آه… أشعر بالحرج قليلًا الآن." },
    },
    {
      speaker: "customer",
      text: "فهمت الخطوة الأولى. ويجب أن أشرحها أيضًا لوالدتي في المنزل.",
      choices: [
        "يمكنني أن أعطيك ملخصًا قصيرًا جدًا. ولأي سؤال صحي محدد، يرجى التوجه إلى صيدلي.",
        "احفظي ببساطة كل ما قلته للتو.",
        "لا يمكنني فعل شيء إذا لم تكن حاضرة.",
      ],
      best: 0,
      feedback: "يساعد الملخص على نقل المعلومات، وتبقى الحدود المهنية واضحة.",
      reactions: { good: "شكرًا، سيساعدني ملخص صغير لأشرح لأمي.", almost: "لست متأكدة من قدرتي على شرح ذلك لها." },
    },
  ],
  modules: [
    {
      id: "preference",
      title: "التفضيل اللغوي",
      label: "الاستقبال",
      description: "اسأل عن التفضيل من دون استنتاج مستوى اللغة أو القراءة.",
      question: "أي سؤال يترك الاختيار فعلًا؟",
      answers: ["هل تفضلين الفرنسية البسيطة أم شرحًا شفهيًا بالدارجة؟", "لا بد أنك تتحدثين الدارجة، أليس كذلك؟", "هل تعرفين قراءة الفرنسية؟"],
      correct: 0,
      explanation: "يتيح السؤال للزبونة الاختيار. وقد يسبب افتراض لغتها أو مستوى قراءتها حرجًا لها.",
    },
    {
      id: "structure",
      title: "تنظيم الشرح",
      label: "الوضوح",
      description: "قسّم المعلومات، وقدّم علامة واضحة لكل خطوة.",
      question: "أي تسلسل يساعد على المتابعة بشكل أفضل؟",
      answers: ["خطوة واحدة · إعادة الصياغة · الخطوة التالية", "كل المحتوى · سؤال في النهاية", "مصطلحات صعبة · تكرار · خلاصة"],
      correct: 0,
      explanation: "خطوة، ثم إعادة صياغة، ثم الخطوة التالية. هكذا يمكن للزبونة المتابعة، ويمكنك رؤية ما فهمته.",
    },
    {
      id: "verification",
      title: "التحقق من دون حكم",
      label: "الفهم",
      description: "استخدم إعادة الصياغة للتحقق من الشرح، لا لاختبار الشخص.",
      question: "أي صياغة تحترم الشخص؟",
      answers: ["للتحقق من أنني شرحت بوضوح، كيف تلخصين الخطوة الأولى؟", "أعيدي بالضبط ما قلته للتو.", "هل فهمتِ أم لا؟"],
      correct: 0,
      explanation: "يسأل هذا الأسلوب كيف تلخص الزبونة الخطوة، فيتحقق من شرحك لا من الشخص. أما الصياغتان الأخريان فتضعانها تحت الاختبار.",
    },
  ],
} });

const DEFAULT_COURSE = Object.freeze({ format: "bp-course-1", id: "default", version: 1, fr: CONTENT.fr, ar: CONTENT.ar });
let activeCourse = null;

export function setActiveCourse(course) {
  activeCourse = course ?? null;
}

export function activeCourseData() {
  return activeCourse ?? DEFAULT_COURSE;
}

export function activeCourseKey() {
  return activeCourse ? courseKey(activeCourse) : DEFAULT_COURSE_KEY;
}

export function isCustomCourse() {
  return activeCourse !== null;
}

export function content(lang) {
  if (!activeCourse) return CONTENT[lang] ?? CONTENT.fr;
  return activeCourse[lang] ?? activeCourse.fr;
}
export function contentLang(lang) {
  return (activeCourse ?? CONTENT)[lang] ? lang : "fr";
}
export function audioBase() {
  return activeCourse ? `audio/courses/${activeCourse.id}` : "audio";
}
