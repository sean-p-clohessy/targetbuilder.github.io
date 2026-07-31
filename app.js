(() => {
  "use strict";

  const DATA_URL = "./data/targets.json?v=20260731-2";
  const storageThemeKey = "target-builder-theme";
  const genericEvidence = ["Tutor observation", "Learner work", "ProMonitor record", "Learner discussion", "Custom"];
  const genericReviewers = ["Personal tutor", "Subject lecturer", "Success Coach", "Curriculum lead", "English or maths lecturer", "Work experience coordinator", "Custom"];
  const genericMeasures = ["Every scheduled session", "Every college day", "At least once per lesson", "At least once per week", "By the agreed deadline"];

  const state = {
    categories: [],
    selectedCategory: null,
    selectedIssue: null,
    currentView: "categories",
    previousView: "categories",
    baseOutput: null,
    generated: false,
    manuallyEdited: false
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

  const icons = {
    calendar: '<svg viewBox="0 0 24 24"><path d="M7 2h2v2h6V2h2v2h3v18H4V4h3V2Zm11 8H6v10h12V10ZM6 6v2h12V6H6Z"/></svg>',
    clock: '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 2a8 8 0 1 1 0 16 8 8 0 0 1 0-16Zm-1 2h2v5.6l3.7 2.1-1 1.8-4.7-2.8V6Z"/></svg>',
    spark: '<svg viewBox="0 0 24 24"><path d="m12 2 1.7 6.3L20 10l-6.3 1.7L12 18l-1.7-6.3L4 10l6.3-1.7L12 2Zm7 14 .8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16Z"/></svg>',
    document: '<svg viewBox="0 0 24 24"><path d="M6 2h8l4 4v16H6V2Zm2 2v16h8V8h-4V4H8Zm2 7h4v2h-4v-2Zm0 4h4v2h-4v-2Z"/></svg>',
    folder: '<svg viewBox="0 0 24 24"><path d="M3 4h7l2 2h9v14H3V4Zm2 4v10h14V8H5Z"/></svg>',
    shield: '<svg viewBox="0 0 24 24"><path d="m12 2 8 3v6c0 5.1-3.1 9-8 11-4.9-2-8-5.9-8-11V5l8-3Zm0 2.1L6 6.4V11c0 4 2.2 7 6 8.8 3.8-1.8 6-4.8 6-8.8V6.4l-6-2.3Zm-1 4h2v5h-2v-5Zm0 6.5h2v2h-2v-2Z"/></svg>',
    message: '<svg viewBox="0 0 24 24"><path d="M3 3h18v15H8l-5 4V3Zm2 2v12.8L7.3 16H19V5H5Zm3 3h8v2H8V8Zm0 4h6v2H8v-2Z"/></svg>',
    people: '<svg viewBox="0 0 24 24"><path d="M9 3a4 4 0 1 1 0 8 4 4 0 0 1 0-8Zm0 2a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm7.5 1a3 3 0 1 1 0 6 3 3 0 0 1 0-6Zm0 2a1 1 0 1 0 0 2 1 1 0 0 0 0-2ZM9 12c4.7 0 7 2.2 7 6v2H2v-2c0-3.8 2.3-6 7-6Zm0 2c-3.5 0-5 1.3-5 4h10c0-2.7-1.5-4-5-4Zm7.5-.5c3.7 0 5.5 1.8 5.5 5.5v1h-4v-2h1.9c-.2-1.6-1.1-2.3-3.4-2.5v-2Z"/></svg>',
    book: '<svg viewBox="0 0 24 24"><path d="M3 3h8a3 3 0 0 1 2 1 3 3 0 0 1 2-1h6v17h-6a3 3 0 0 0-2 1 3 3 0 0 0-2-1H3V3Zm2 2v13h6c.4 0 .7.1 1 .2V7c0-1.1-.9-2-2-2H5Zm10 0c-1.1 0-2 .9-2 2v11.2c.3-.1.6-.2 1-.2h5V5h-4Z"/></svg>',
    briefcase: '<svg viewBox="0 0 24 24"><path d="M9 3h6l2 3h4v15H3V6h4l2-3Zm1.1 3h4l-.7-1h-2.6l-.7 1ZM5 8v4h14V8H5Zm14 6h-6v2h-2v-2H5v5h14v-5Z"/></svg>',
    chart: '<svg viewBox="0 0 24 24"><path d="M4 3h2v16h15v2H4V3Zm14 3 2 2-5 5-3-3-4 4-1.4-1.4L12 7.2l3 3L18 6Z"/></svg>'
  };

  const escapeHTML = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const normalise = (value) => String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const formatUKDate = (date) => new Intl.DateTimeFormat("en-GB", {
    day: "2-digit", month: "2-digit", year: "numeric"
  }).format(date);

  const dateAfterWeeks = (weeks) => {
    const date = new Date();
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() + (weeks * 7));
    return date;
  };

  const isoDate = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const containsPersonalData = (text) => {
    const value = String(text || "");
    return /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(value)
      || /\b(?:07\d{9}|(?:\+44\s?7)\d{9}|\d{10,11})\b/.test(value.replace(/[\s()-]/g, ""))
      || /\b(?:student\s*(?:id|number)|id)\s*[:#-]?\s*\d{5,12}\b/i.test(value);
  };

  const showToast = (message) => {
    const toast = $("[data-toast]");
    toast.textContent = message;
    toast.classList.add("show");
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove("show"), 2200);
  };

  const applyTheme = (theme) => {
    document.documentElement.dataset.theme = theme;
    const button = $("[data-theme-toggle]");
    const isDark = theme === "dark";
    button.setAttribute("aria-pressed", String(isDark));
    button.setAttribute("aria-label", `Switch to ${isDark ? "light" : "dark"} mode`);
    $("[data-theme-label]").textContent = isDark ? "Dark mode" : "Light mode";
  };

  const initialiseTheme = () => {
    let theme = document.documentElement.dataset.theme;
    if (!theme) {
      try { theme = localStorage.getItem(storageThemeKey); } catch {}
    }
    applyTheme(theme || (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
  };

  const showView = (name, options = {}) => {
    $$("[data-view]").forEach((view) => { view.hidden = view.dataset.view !== name; });
    state.previousView = state.currentView;
    state.currentView = name;
    if (options.scroll !== false) {
      const view = $(`[data-view="${name}"]`);
      view?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const renderCategories = () => {
    const grid = $("[data-category-grid]");
    grid.replaceChildren();
    state.categories.forEach((category) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "category-card";
      button.dataset.categoryId = category.id;
      button.innerHTML = `
        <span class="category-icon" aria-hidden="true">${icons[category.icon] || icons.document}</span>
        <h3>${escapeHTML(category.name)}</h3>
        <p>${escapeHTML(category.description)}</p>
        <span class="category-meta">${category.issues.length} tailored options</span>`;
      button.addEventListener("click", () => openCategory(category.id));
      grid.append(button);
    });
  };

  const openCategory = (categoryId) => {
    const category = state.categories.find((item) => item.id === categoryId);
    if (!category) return;
    state.selectedCategory = category;
    state.selectedIssue = null;
    $("[data-selected-category-label]").textContent = category.name;
    $("[data-issues-heading]").textContent = "Choose the specific issue";
    $("[data-issues-description]").textContent = category.description;
    renderIssues(category.issues, $("[data-issue-grid]"), category.name);
    showView("issues");
  };

  const renderIssues = (issues, container, categoryName = "") => {
    container.replaceChildren();
    issues.forEach((issue) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "issue-card";
      button.innerHTML = `
        <span class="tag">${escapeHTML(categoryName)}</span>
        <strong>${escapeHTML(issue.issue)}</strong>
        <small>${escapeHTML(issue.title)}</small>`;
      button.addEventListener("click", () => selectIssue(issue.categoryId || state.selectedCategory?.id, issue.id));
      container.append(button);
    });
  };

  const getMeasureOptions = (issue) => {
    const measures = issue?.measures?.length ? issue.measures : genericMeasures;
    return [...new Set(measures)];
  };

  const populateChoices = (issue) => {
    const wrap = $("[data-measure-choices]");
    wrap.replaceChildren();
    getMeasureOptions(issue).slice(0, 4).forEach((measure, index) => {
      const label = document.createElement("label");
      label.innerHTML = `<input type="radio" name="measure" value="${escapeHTML(measure)}"${index === 0 ? " checked" : ""}><span>${escapeHTML(measure)}</span>`;
      wrap.append(label);
    });
    const custom = document.createElement("label");
    custom.innerHTML = '<input type="radio" name="measure" value="custom"><span>Write a custom measure</span>';
    wrap.append(custom);
  };

  const populateSelect = (selector, values, customLabel = "Custom") => {
    const select = $(selector);
    const options = [...new Set([...values, customLabel])];
    select.replaceChildren(...options.map((value) => {
      const option = document.createElement("option");
      option.value = value === customLabel ? "custom" : value;
      option.textContent = value;
      return option;
    }));
  };

  const setRecommendedDuration = (duration) => {
    const value = ["1 week", "2 weeks", "3 weeks", "4 weeks", "date", "next review"].includes(duration) ? duration : "2 weeks";
    const radio = $(`[name="duration"][value="${value}"]`);
    if (radio) radio.checked = true;
    $("[data-review-date-wrap]").hidden = value !== "date";
    if (value === "date" && !$("#review-date").value) $("#review-date").value = isoDate(dateAfterWeeks(2));
  };

  const selectIssue = (categoryId, issueId) => {
    const category = state.categories.find((item) => item.id === categoryId);
    const issue = category?.issues.find((item) => item.id === issueId);
    if (!category || !issue) return;
    state.selectedCategory = category;
    state.selectedIssue = issue;
    state.generated = false;
    state.manuallyEdited = false;
    $("#action").value = issue.action || "";
    populateChoices(issue);
    populateSelect("#evidence", category.evidenceOptions || genericEvidence);
    populateSelect("#reviewer", category.reviewerOptions || genericReviewers);
    setRecommendedDuration(issue.duration);
    updateContext();
    resetOutput();
    updateFormState();
    showView("builder");
  };

  const startGuided = () => {
    state.selectedCategory = null;
    state.selectedIssue = null;
    state.generated = false;
    state.manuallyEdited = false;
    $("#action").value = "";
    populateChoices(null);
    populateSelect("#evidence", genericEvidence);
    populateSelect("#reviewer", genericReviewers);
    setRecommendedDuration("2 weeks");
    updateContext();
    resetOutput();
    updateFormState();
    showView("builder");
    $("#action").focus();
  };

  const updateContext = () => {
    const category = state.selectedCategory;
    const issue = state.selectedIssue;
    $("[data-category-value]").textContent = category?.name || "Custom target";
    $("[data-issue-value]").textContent = issue?.issue || "Choose your own wording";
    $("[data-context-icon]").innerHTML = icons[category?.icon] || icons.document;
  };

  const getFormValues = () => {
    const measureRadio = $('[name="measure"]:checked');
    const durationRadio = $('[name="duration"]:checked');
    const evidence = $("#evidence").value === "custom" ? $("#custom-evidence").value.trim() : $("#evidence").value;
    const reviewer = $("#reviewer").value === "custom" ? $("#custom-reviewer").value.trim() : $("#reviewer").value;
    return {
      action: $("#action").value.trim().replace(/[.!?]+$/, ""),
      measure: measureRadio?.value === "custom" ? $("#custom-measure").value.trim().replace(/[.!?]+$/, "") : (measureRadio?.value || ""),
      duration: durationRadio?.value || "",
      reviewDate: $("#review-date").value,
      evidence,
      reviewer
    };
  };

  const reviewDetails = (values) => {
    if (values.duration === "date") {
      if (!values.reviewDate) return { lead: "By the selected review date", label: "the selected review date", date: "" };
      const date = new Date(`${values.reviewDate}T12:00:00`);
      return { lead: `By ${formatUKDate(date)}`, label: formatUKDate(date), date: formatUKDate(date) };
    }
    if (values.duration === "next review") return { lead: "By the next progress review", label: "the next progress review", date: "" };
    const weeks = Number(values.duration.split(" ")[0]) || 2;
    const date = formatUKDate(dateAfterWeeks(weeks));
    return {
      lead: `For the next ${weeks === 1 ? "teaching week" : `${weeks} teaching weeks`}`,
      label: `the end of the ${weeks === 1 ? "one-week" : `${weeks}-week`} period on ${date}`,
      date
    };
  };

  const lowerFirst = (text) => text ? text.charAt(0).toLowerCase() + text.slice(1) : "";

  const evidencePhrase = (value) => {
    const text = lowerFirst(value || "the agreed evidence source");
    return /^(the|your|a|an)\b/.test(text) ? text : `the ${text}`;
  };

  const reviewerPhrase = (value) => {
    const text = lowerFirst(value || "appropriate member of staff");
    return /^(the|your|a|an)\b/.test(text) ? text : `your ${text}`;
  };

  const actionAndMeasure = (action, measure) => {
    if (!measure) return action;
    if (/^(on|in|for|at|within|before|by|after|during|with|using|through)\b/i.test(measure)) {
      return `${action} ${measure}`;
    }
    return `${action}. Success will be shown by ${measure}`;
  };

  const buildOutput = (values) => {
    const review = reviewDetails(values);
    const action = lowerFirst(values.action);
    const measure = lowerFirst(values.measure);
    const evidence = evidencePhrase(values.evidence);
    const reviewer = reviewerPhrase(values.reviewer);
    const issue = state.selectedIssue;
    const category = state.selectedCategory;
    const learner = `${review.lead}, you will ${actionAndMeasure(action, measure)}. This will be checked using ${evidence} and reviewed with ${reviewer} at ${review.label}.`
      .replace(/\s+/g, " ")
      .replace(/\s+\./g, ".")
      .trim();
    const supportTemplate = issue?.support || category?.supportTemplate || "{reviewer} to discuss the target, agree appropriate support and review progress during the agreed period.";
    const support = supportTemplate.replaceAll("{reviewer}", values.reviewer || "The appropriate member of staff");
    const reviewNote = `Review the learner's ${category?.name.toLowerCase() || "target"} evidence for the agreed period. Record whether the target has been achieved, partially achieved or not achieved, identify any continuing barriers and agree the next action.`;
    return { learner, support, reviewNote };
  };

  const validate = (focus = false) => {
    const values = getFormValues();
    const errors = {
      action: values.action ? "" : "Enter a clear learner action.",
      measure: values.measure ? "" : "Choose or enter a success measure.",
      duration: values.duration === "date" && !values.reviewDate ? "Choose a review date." : (!values.duration ? "Choose a review period." : "")
    };
    Object.entries(errors).forEach(([field, message]) => {
      $(`[data-error-for="${field}"]`).textContent = message;
    });
    $("#action").setAttribute("aria-invalid", String(Boolean(errors.action)));
    const isValid = !Object.values(errors).some(Boolean);
    const readiness = $("[data-readiness]");
    readiness.textContent = isValid ? "Ready to generate" : "Complete the required fields";
    readiness.dataset.ready = String(isValid);
    if (!isValid && focus) {
      if (errors.action) $("#action").focus();
      else if (errors.measure) $('[name="measure"]')?.focus();
      else if (errors.duration) $("#review-date").focus();
    }
    return { isValid, values };
  };

  const generate = ({ preserveEdits = false } = {}) => {
    const validation = validate(true);
    if (!validation.isValid) return;
    if (containsPersonalData([validation.values.action, validation.values.measure, validation.values.evidence, validation.values.reviewer].join(" "))) {
      showPrivacyWarning("Please remove the email address, phone number or student ID before generating the target.");
      return;
    }
    const output = buildOutput(validation.values);
    state.baseOutput = output;
    state.generated = true;
    state.manuallyEdited = false;
    if (!preserveEdits) {
      $("#learner-target").value = output.learner;
      $("#staff-action").value = output.support;
      $("#review-note").value = output.reviewNote;
    }
    $("[data-preview-empty]").hidden = true;
    $("[data-preview-output]").hidden = false;
    $("[data-post-actions]").hidden = false;
    setPreviewStatus("Target generated", "generated");
    updateOutputCounts();
    updateSmartChecks();
    showToast("Target generated and ready to review");
  };

  const setPreviewStatus = (label, className = "") => {
    const status = $("[data-preview-status]");
    status.className = `status-badge ${className}`.trim();
    status.innerHTML = `<span aria-hidden="true"></span>${escapeHTML(label)}`;
  };

  const resetOutput = () => {
    state.baseOutput = null;
    state.generated = false;
    state.manuallyEdited = false;
    $("#learner-target").value = "";
    $("#staff-action").value = "";
    $("#review-note").value = "";
    $("[data-preview-empty]").hidden = false;
    $("[data-preview-output]").hidden = true;
    $("[data-post-actions]").hidden = true;
    setPreviewStatus("Not generated");
    resetSmartChecks();
  };

  const updateOutputCounts = () => {
    const length = $("#learner-target").value.length;
    $("[data-target-count]").textContent = `${length} characters`;
    $("[data-length-note]").hidden = length < 500;
  };

  const smartResults = () => {
    const values = getFormValues();
    const text = $("#learner-target").value.toLowerCase();
    return {
      specific: Boolean(values.action && values.action.split(/\s+/).length >= 3),
      measurable: Boolean(values.measure),
      achievable: Boolean(text) && !/\b100%\b|\balways succeed\b|\bnever fail\b/.test(text),
      relevant: Boolean(state.selectedCategory && state.selectedIssue) || Boolean(values.action),
      timebound: Boolean(values.duration && (values.duration !== "date" || values.reviewDate))
    };
  };

  const updateSmartChecks = () => {
    const results = smartResults();
    Object.entries(results).forEach(([key, pass]) => {
      const item = $(`[data-smart="${key}"]`);
      item.dataset.pass = String(pass);
      $("b", item).textContent = pass ? "✓" : "!";
    });
  };

  const resetSmartChecks = () => {
    $$("[data-smart]").forEach((item) => {
      delete item.dataset.pass;
      $("b", item).textContent = "—";
    });
  };

  const applyVariant = (kind) => {
    if (!state.generated || !state.baseOutput) return;
    const base = state.baseOutput.learner;
    let next = base;
    if (kind === "supportive") {
      next = base.replace(/^(For the next|By)/, "To help you make steady progress, $1");
    } else if (kind === "firm") {
      next = base.replace("you will", "you are expected to");
    } else if (kind === "short") {
      const values = getFormValues();
      const review = reviewDetails(values);
      next = `${review.lead}, you will ${actionAndMeasure(lowerFirst(values.action), lowerFirst(values.measure))}. Progress will be checked using ${evidencePhrase(values.evidence)} at ${review.label}.`
        .replace(/\s+/g, " ").replace(/\s+\./g, ".");
    } else if (kind === "detailed") {
      next = `${base} Raise any barrier promptly so that support can be considered before the review point.`;
    } else if (kind === "reset") {
      next = base;
    }
    $("#learner-target").value = next;
    state.manuallyEdited = kind !== "reset";
    setPreviewStatus(kind === "reset" ? "Recommended wording" : "Wording adjusted", kind === "reset" ? "generated" : "edited");
    updateOutputCounts();
    updateSmartChecks();
  };

  const showPrivacyWarning = (message, target = "[data-form-warning]") => {
    const warning = $(target);
    warning.textContent = message;
    warning.hidden = false;
  };

  const clearPrivacyWarning = (target = "[data-form-warning]") => {
    const warning = $(target);
    warning.textContent = "";
    warning.hidden = true;
  };

  const checkFreeText = () => {
    const values = [
      $("#action").value, $("#custom-measure").value, $("#custom-evidence").value,
      $("#custom-reviewer").value, $("#learner-target").value, $("#staff-action").value, $("#review-note").value
    ].join(" ");
    if (containsPersonalData(values)) {
      showPrivacyWarning("This text may contain an email address, phone number or student ID. Remove personal information before copying.");
    } else {
      clearPrivacyWarning();
    }
  };

  const updateFormState = () => {
    const actionLength = $("#action").value.length;
    $("[data-count-for='action']").textContent = `${actionLength} / 300`;
    const measure = $('[name="measure"]:checked')?.value;
    $("[data-custom-measure-wrap]").hidden = measure !== "custom";
    const duration = $('[name="duration"]:checked')?.value;
    $("[data-review-date-wrap]").hidden = duration !== "date";
    $("[data-custom-evidence-wrap]").hidden = $("#evidence").value !== "custom";
    $("[data-custom-reviewer-wrap]").hidden = $("#reviewer").value !== "custom";
    validate(false);
    if (state.generated) updateSmartChecks();
  };

  const findMatches = (query) => {
    const words = normalise(query).split(" ").filter((word) => word.length > 1);
    const results = [];
    state.categories.forEach((category) => {
      category.issues.forEach((issue) => {
        const exactTerms = normalise([issue.issue, issue.title, ...(issue.aliases || [])].join(" "));
        const broadTerms = normalise([category.name, category.description, issue.action, ...(issue.measures || [])].join(" "));
        let score = 0;
        words.forEach((word) => {
          if (exactTerms.includes(word)) score += word.length * 4;
          if (broadTerms.includes(word)) score += word.length;
        });
        const normalQuery = normalise(query);
        if (exactTerms.includes(normalQuery)) score += normalQuery.length * 5;
        if (score > 0) results.push({ ...issue, categoryId: category.id, categoryName: category.name, score });
      });
    });
    return results.sort((a, b) => b.score - a.score).slice(0, 12);
  };

  const search = (query) => {
    const value = query.trim();
    clearPrivacyWarning("[data-search-warning]");
    if (!value) {
      showView("categories");
      return;
    }
    if (containsPersonalData(value)) {
      showPrivacyWarning("This search may contain personal information. Remove the email address, phone number or student ID and describe only the general concern.", "[data-search-warning]");
      return;
    }
    const matches = findMatches(value);
    const container = $("[data-search-results]");
    renderIssues(matches, container);
    $$("[data-search-results] .issue-card").forEach((card, index) => {
      $(".tag", card).textContent = matches[index].categoryName;
    });
    $("[data-results-summary]").textContent = matches.length
      ? `${matches.length} relevant ${matches.length === 1 ? "target" : "targets"} for “${value}”`
      : `No close matches for “${value}”`;
    container.hidden = matches.length === 0;
    $("[data-no-results]").hidden = matches.length > 0;
    showView("search");
  };

  const copyText = async (text, button, label) => {
    if (!text.trim()) return;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const temporary = document.createElement("textarea");
      temporary.value = text;
      temporary.style.position = "fixed";
      temporary.style.opacity = "0";
      document.body.append(temporary);
      temporary.select();
      document.execCommand("copy");
      temporary.remove();
    }
    const original = button.textContent;
    button.textContent = "Copied";
    showToast(`${label} copied`);
    window.setTimeout(() => { button.textContent = original; }, 1600);
  };

  const clearForm = () => {
    const hasMeaningfulText = $("#action").value.trim() || state.generated;
    if (hasMeaningfulText && !window.confirm("Clear this target and all generated wording?")) return;
    if (state.selectedIssue) {
      selectIssue(state.selectedCategory.id, state.selectedIssue.id);
    } else {
      startGuided();
    }
    showToast("Target cleared");
  };

  const startNew = () => {
    if (state.generated && !window.confirm("Start a new target? The current generated wording will be cleared.")) return;
    state.selectedCategory = null;
    state.selectedIssue = null;
    resetOutput();
    $("#search").value = "";
    showView("categories");
  };

  const loadData = async () => {
    const response = await fetch(DATA_URL);
    if (!response.ok) throw new Error(`Target library could not be loaded (${response.status})`);
    const data = await response.json();
    if (!Array.isArray(data.categories) || data.categories.length === 0) throw new Error("Target library is empty");
    state.categories = data.categories;
    renderCategories();
  };

  const showLoadingError = (error) => {
    console.error(error);
    const grid = $("[data-category-grid]");
    grid.innerHTML = `<div class="empty-state"><span aria-hidden="true">!</span><h3>The target library could not be loaded</h3><p>Run the project through a local web server and refresh the page. No information has been sent anywhere.</p><button class="primary-button" type="button" data-retry-load>Try again</button></div>`;
    $("[data-retry-load]")?.addEventListener("click", initialiseData);
  };

  const initialiseData = async () => {
    try { await loadData(); } catch (error) { showLoadingError(error); }
  };

  const bind = () => {
    $("[data-theme-toggle]").addEventListener("click", () => {
      const theme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      try { localStorage.setItem(storageThemeKey, theme); } catch {}
      applyTheme(theme);
    });

    $("[data-search-form]").addEventListener("submit", (event) => {
      event.preventDefault();
      search($("#search").value);
    });
    $$("[data-search-example]").forEach((button) => button.addEventListener("click", () => {
      $("#search").value = button.dataset.searchExample;
      search(button.dataset.searchExample);
    }));
    $("#search").addEventListener("input", () => clearPrivacyWarning("[data-search-warning]"));

    $$("[data-guided-start]").forEach((button) => button.addEventListener("click", startGuided));
    $$("[data-return-categories]").forEach((button) => button.addEventListener("click", () => showView("categories")));
    $("[data-back-categories]").addEventListener("click", () => showView("categories"));
    $("[data-builder-back]").addEventListener("click", () => showView(state.selectedCategory ? "issues" : "categories"));
    $("[data-change-issue]").addEventListener("click", () => showView(state.selectedCategory ? "issues" : "categories"));

    $("#target-form").addEventListener("submit", (event) => {
      event.preventDefault();
      generate();
    });
    $("#target-form").addEventListener("input", (event) => {
      updateFormState();
      if (event.target.matches("input[type='text'], textarea")) checkFreeText();
    });
    $("#target-form").addEventListener("change", updateFormState);
    $("#evidence").addEventListener("change", updateFormState);
    $("#reviewer").addEventListener("change", updateFormState);
    $("[data-clear-form]").addEventListener("click", clearForm);

    $$("[data-variant]").forEach((button) => button.addEventListener("click", () => applyVariant(button.dataset.variant)));
    ["#learner-target", "#staff-action", "#review-note"].forEach((selector) => {
      $(selector).addEventListener("input", () => {
        state.manuallyEdited = true;
        setPreviewStatus("Draft edited", "edited");
        updateOutputCounts();
        updateSmartChecks();
        checkFreeText();
      });
    });

    $$("[data-copy]").forEach((button) => button.addEventListener("click", () => {
      const kind = button.dataset.copy;
      const values = {
        learner: $("#learner-target").value,
        staff: $("#staff-action").value,
        review: $("#review-note").value,
        all: `Learner SMART target\n${$("#learner-target").value}\n\nStaff support action\n${$("#staff-action").value}\n\nReview note\n${$("#review-note").value}`
      };
      const labels = { learner: "Learner target", staff: "Staff action", review: "Review note", all: "All target content" };
      if (containsPersonalData(values[kind])) {
        showPrivacyWarning("Remove the possible email address, phone number or student ID before copying.");
        showToast("Please remove personal information before copying");
        return;
      }
      copyText(values[kind], button, labels[kind]);
    }));

    $("[data-print]").addEventListener("click", () => window.print());
    $("[data-start-new]").addEventListener("click", startNew);
  };

  const initialiseDates = () => {
    [1, 2, 3, 4].forEach((weeks) => {
      $(`[data-date-for="${weeks} week${weeks === 1 ? "" : "s"}"]`).textContent = `Review ${formatUKDate(dateAfterWeeks(weeks))}`;
    });
    $("#review-date").min = isoDate(new Date());
  };

  initialiseTheme();
  initialiseDates();
  bind();
  initialiseData();
})();
