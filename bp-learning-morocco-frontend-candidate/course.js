export const DEFAULT_COURSE_KEY = "default@1";
export const COURSE_STORAGE_KEY = "bp-learning-course";
const MAX_FILE_SIZE = 200000;

function isObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function has(value, key) {
  return Object.prototype.hasOwnProperty.call(value, key);
}

function validateValue(value, path, add, options = {}) {
  const { required = true, min = 1, max } = options;
  if (value === undefined) {
    if (required) add("missing", path);
    return undefined;
  }
  if (typeof value !== "string") {
    add("type", path);
    return undefined;
  }
  const clean = value.trim();
  if (required && clean.length < min) add("missing", path);
  if (max !== undefined && clean.length > max) add("tooLong", path, { max });
  return clean;
}

function validateObject(value, path, add) {
  if (value === undefined) {
    add("missing", path);
    return false;
  }
  if (!isObject(value)) {
    add("type", path);
    return false;
  }
  return true;
}

function validateArray(value, path, add, count) {
  if (value === undefined) {
    add("missing", path);
    return false;
  }
  if (!Array.isArray(value)) {
    add("type", path);
    return false;
  }
  if (value.length !== count) add("count", path, { expected: count, actual: value.length });
  return true;
}

function validateIndex(value, path, add) {
  if (!Number.isInteger(value) || value < 0 || value > 2) {
    add("index", path, { min: 0, max: 2 });
    return 0;
  }
  return value;
}

function block(raw, prefix, add) {
  if (!validateObject(raw, prefix, add)) return null;
  const courseRaw = raw.course;
  const scenarioRaw = raw.scenario;
  const preparationRaw = raw.preparation;
  const dialogueRaw = raw.dialogue;
  const modulesRaw = raw.modules;
  if (!validateObject(courseRaw, `${prefix}.course`, add)) return null;
  if (!validateObject(scenarioRaw, `${prefix}.scenario`, add)) return null;
  if (!validateArray(preparationRaw, `${prefix}.preparation`, add, 3)) return null;
  if (!validateArray(dialogueRaw, `${prefix}.dialogue`, add, 3)) return null;
  if (!validateArray(modulesRaw, `${prefix}.modules`, add, 3)) return null;

  const course = {
    title: validateValue(courseRaw.title, `${prefix}.course.title`, add, { max: 90 }) ?? "",
    duration: validateValue(courseRaw.duration, `${prefix}.course.duration`, add, { max: 30 }) ?? "",
    eyebrow: validateValue(courseRaw.eyebrow, `${prefix}.course.eyebrow`, add) ?? "",
  };
  const description = validateValue(courseRaw.description, `${prefix}.course.description`, add, { required: false, min: 0, max: 240 });
  const level = validateValue(courseRaw.level, `${prefix}.course.level`, add, { required: false, min: 0 });
  if (description !== undefined) course.description = description;
  if (level !== undefined) course.level = level;

  const scenario = {
    initials: validateValue(scenarioRaw.initials, `${prefix}.scenario.initials`, add, { max: 3 }) ?? "",
    customer: validateValue(scenarioRaw.customer, `${prefix}.scenario.customer`, add, { max: 60 }) ?? "",
    context: validateValue(scenarioRaw.context, `${prefix}.scenario.context`, add, { max: 400 }) ?? "",
    goal: validateValue(scenarioRaw.goal, `${prefix}.scenario.goal`, add, { max: 240 }) ?? "",
  };

  const preparation = preparationRaw.slice(0, 3).map((item, index) => {
    const path = `${prefix}.preparation[${index}]`;
    if (!validateObject(item, path, add)) return { id: "", title: "", body: "" };
    return {
      id: validateValue(item.id, `${path}.id`, add) ?? "",
      title: validateValue(item.title, `${path}.title`, add, { max: 60 }) ?? "",
      body: validateValue(item.body, `${path}.body`, add, { max: 240 }) ?? "",
    };
  });

  const dialogue = dialogueRaw.slice(0, 3).map((item, index) => {
    const path = `${prefix}.dialogue[${index}]`;
    if (!validateObject(item, path, add)) return { text: "", choices: [], best: 0, feedback: "", reactions: { good: "", almost: "" } };
    const choices = item.choices;
    if (!validateArray(choices, `${path}.choices`, add, 3)) return { text: "", choices: [], best: 0, feedback: "", reactions: { good: "", almost: "" } };
    const reactions = item.reactions;
    if (!validateObject(reactions, `${path}.reactions`, add)) return { text: "", choices: [], best: 0, feedback: "", reactions: { good: "", almost: "" } };
    return {
      text: validateValue(item.text, `${path}.text`, add, { max: 300 }) ?? "",
      choices: choices.slice(0, 3).map((choice, choiceIndex) => validateValue(choice, `${path}.choices[${choiceIndex}]`, add, { max: 240 }) ?? ""),
      best: validateIndex(item.best, `${path}.best`, add),
      feedback: validateValue(item.feedback, `${path}.feedback`, add, { max: 300 }) ?? "",
      reactions: {
        good: validateValue(reactions.good, `${path}.reactions.good`, add, { max: 160 }) ?? "",
        almost: validateValue(reactions.almost, `${path}.reactions.almost`, add, { max: 160 }) ?? "",
      },
    };
  });

  const ids = new Set();
  const modules = modulesRaw.slice(0, 3).map((item, index) => {
    const path = `${prefix}.modules[${index}]`;
    if (!validateObject(item, path, add)) return { id: "", label: "", title: "", description: "", question: "", answers: [], correct: 0, explanation: "" };
    const id = validateValue(item.id, `${path}.id`, add) ?? "";
    if (id && !/^[a-z0-9-]+$/.test(id)) add("id", `${path}.id`, { pattern: "[a-z0-9-]" });
    if (ids.has(id)) add("duplicateId", `${path}.id`, { id });
    ids.add(id);
    const answers = item.answers;
    if (!validateArray(answers, `${path}.answers`, add, 3)) return { id, label: "", title: "", description: "", question: "", answers: [], correct: 0, explanation: "" };
    return {
      id,
      label: validateValue(item.label, `${path}.label`, add, { max: 40 }) ?? "",
      title: validateValue(item.title, `${path}.title`, add, { max: 90 }) ?? "",
      description: validateValue(item.description, `${path}.description`, add, { min: 0, max: 240 }) ?? "",
      question: validateValue(item.question, `${path}.question`, add, { max: 200 }) ?? "",
      answers: answers.slice(0, 3).map((answer, answerIndex) => validateValue(answer, `${path}.answers[${answerIndex}]`, add, { max: 200 }) ?? ""),
      correct: validateIndex(item.correct, `${path}.correct`, add),
      explanation: validateValue(item.explanation, `${path}.explanation`, add, { max: 300 }) ?? "",
    };
  });

  return { course, scenario, preparation, dialogue, modules };
}

export function validateCourse(raw) {
  const errors = [];
  const add = (code, path, params = {}) => {
    if (errors.length < 8) errors.push({ code, path, params });
  };
  if (!isObject(raw)) return { ok: false, errors: [{ code: "type", path: "cours", params: {} }] };
  if (raw.format !== "bp-course-1") add("format", "format", { expected: "bp-course-1" });
  const id = validateValue(raw.id, "id", add, { max: 40 });
  if (id !== undefined && !/^[a-z0-9-]{3,40}$/.test(id)) add("id", "id", { pattern: "[a-z0-9-]", min: 3, max: 40 });
  if (!Number.isInteger(raw.version) || raw.version <= 0) add("version", "version", { positive: true });

  const fr = block(raw.fr, "fr", add);
  const ar = has(raw, "ar") ? block(raw.ar, "ar", add) : undefined;
  if (errors.length) return { ok: false, errors };
  const course = { format: "bp-course-1", id, version: raw.version, fr };
  if (ar) course.ar = ar;
  return { ok: true, course };
}

export function parseCourseFile(text) {
  if (typeof text !== "string" || text.length > MAX_FILE_SIZE) {
    return { ok: false, errors: [{ code: "size", path: "fichier", params: { max: MAX_FILE_SIZE } }] };
  }
  let raw;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, errors: [{ code: "json", path: "fichier", params: {} }] };
  }
  return validateCourse(raw);
}

export function courseKey(course) {
  return `${course.id}@${course.version}`;
}
