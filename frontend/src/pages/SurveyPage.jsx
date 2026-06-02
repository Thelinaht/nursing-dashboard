import { useState, useEffect } from "react";
import Layout from "../components/Layout";
import "../styles/SurveyPage.css";

const PES_SCALES = [
    { name: "Nurse Participation in Hospital Affairs", items: ["Career development/clinical ladder opportunity", "Opportunity for staff nurses to participate in policy decisions", "A chief nursing officer which is highly visible and accessible to staff", "A chief nursing officer equal in power and authority to other top-level hospital executives", "Opportunities for advancement", "Administration that listens and responds to employee concerns", "Staff nurses are involved in the internal governance of the hospital", "Staff nurses have the opportunity to serve on hospital and nursing committees", "Nursing administrators consult with staff on daily problems and procedures"] },
    { name: "Nursing Foundations for Quality of Care", items: ["Active staff development or continuing education programs for nurses", "High standards of nursing care are expected by the administration", "A clear philosophy of nursing that pervades the patient care environment", "Working with nurses who are clinically competent", "An active quality assurance program", "A preceptor program for newly hired RNs", "Nursing care is based on a nursing, rather than a medical, model", "Written, up-to-date nursing care plans for all patients", "Patient care assignments that foster continuity of care", "Use of nursing diagnoses"] },
    { name: "Nurse Manager Ability, Leadership, and Support", items: ["A supervisory staff that is supportive of the nurses", "Supervisors use mistakes as learning opportunities, not criticism", "A nurse manager who is a good manager and leader", "Praise and recognition for a job well done", "A nurse manager who backs up the nursing staff in decision-making, even if the conflict is with a physician"] },
    { name: "Staffing and Resource Adequacy", items: ["Adequate support services allow me to spend time with my patients", "Enough time and opportunity to discuss patient care problems with other nurses", "Enough registered nurses to provide quality patient care", "Enough staff to get the work done"] },
    { name: "Collegial Nurse-Physician Relations", items: ["Physicians and nurses have good working relationships", "A lot of teamwork between nurses and physicians", "Collaboration (joint practice) between nurses and physicians"] },
    { name: "Nurse-Nurse Interaction Scale", items: ["RNs I work with count on each other to pitch in and help when things get busy", "There is a good deal of teamwork among RNs I work with", "RNs I work with support each other"] },
];

const RN_SCALES = [
    { name: "Task", items: ["RNs are satisfied with the nursing care we provide on our unit", "RNs on our unit have sufficient time for direct patient care", "RNs have plenty of opportunity to discuss patient care problems with each other on our unit"] },
    { name: "Nurse-Nurse Interaction", items: ["RNs I work with count on each other to pitch in and help when things get busy", "There is a good deal of teamwork among RNs I work with", "RNs I work with support each other"] },
    { name: "Nurse-Physician Interaction", items: ["In general, physicians cooperate with RNs on our unit", "There is a lot of teamwork between RNs and physicians on our unit", "Physicians at this hospital generally appreciate what RNs do"] },
    { name: "Decision-Making", items: ["As RNs, we feel we have ample opportunity to participate in administrative decision-making", "As RNs, we have all the voice we want in planning policies and procedures for our unit", "Nursing administrators generally consult RNs on our unit about daily problems"] },
    { name: "Autonomy", items: ["As RNs, we have sufficient input into the program of care for each of our patients", "RNs on our unit have a good deal of control over our own work", "As RNs, we are free to adjust our daily practice to fit patient needs"] },
    { name: "Professional Status", items: ["RNs are satisfied with the status of nursing on our unit", "RNs recommend our unit as a good place to work", "Work contributes to a sense of personal achievement for RNs on our unit"] },
    { name: "Pay", items: ["Our present salary is satisfactory to myself and the RNs I work with", "Our pay is reasonable considering what is expected of RNs at this hospital", "Pay here is fair, compared to what we hear about RNs at other hospitals"] },
    { name: "Professional Development Opportunity", items: ["RNs have career development opportunities on our unit", "RNs on our unit have support for pursuing nursing degrees", "RNs on our unit have opportunities for career advancement"] },
    { name: "Professional Development Access", items: ["RNs on our unit have access to regional and national conferences", "On our unit, RNs have access to regular in-service programs", "RNs on our unit have access to continuing education"] },
    { name: "Supportive Nursing Management", items: ["Our nurse manager is a good leader for our unit", "Our nurse manager is supportive of RNs on our unit", "Our nurse manager backs us in decision-making even in conflicts with physicians"] },
    { name: "Nursing Administration", items: ["RNs on our unit are satisfied with the hospital chief nurse executive", "RNs on our unit view the hospital chief nursing executive as equal in authority to other top-level hospital executives", "Our hospital chief nurse executive is visible to myself and RNs I work with"] },
];

const SCALE_LABELS = ["Very Dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very Satisfied"];

const SURVEY_META = {
    pes_nwi: { title: "PES-NWI", fullTitle: "Practice Environment Scale of the Nursing Work Index", scales: PES_SCALES },
    rn_satisfaction: { title: "RN Job Satisfaction", fullTitle: "RN Survey with Job Satisfaction Scales", scales: RN_SCALES },
};

export default function SurveyPage() {
    const [user, setUser] = useState(null);
    const [periods, setPeriods] = useState([]);
    const [activeIdx, setActiveIdx] = useState(0);
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState({});
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const stored = JSON.parse(sessionStorage.getItem("user"));
        setUser(stored);
        const load = async () => {
            try {
                const res = await fetch(`http://localhost:4000/api/surveys/pending?user_id=${stored.user_id}`);
                const data = await res.json();
                setPeriods(data.pending || []);
            } catch { setError("Failed to load surveys."); }
            finally { setLoading(false); }
        };
        if (stored) load();
        else setLoading(false);
    }, []);

    const currentPeriod = periods[activeIdx];
    const meta = currentPeriod ? SURVEY_META[currentPeriod.survey_type] : null;
    const totalItems = meta ? meta.scales.reduce((a, s) => a + s.items.length, 0) : 0;
    const answeredItems = meta
        ? meta.scales.reduce((a, s) => a + s.items.filter((_, i) => answers[`${s.name}__${i}`] !== undefined).length, 0)
        : 0;
    const progress = totalItems ? Math.round((answeredItems / totalItems) * 100) : 0;

    const setAnswer = (subscale, itemIdx, score) =>
        setAnswers(prev => ({ ...prev, [`${subscale}__${itemIdx}`]: score }));

    const handleSubmit = async () => {
        if (answeredItems < totalItems) return;
        setSubmitting(true); setError("");
        try {
            const responses = [];
            meta.scales.forEach(s => s.items.forEach((_, i) =>
                responses.push({ subscale: s.name, item_index: i, score: answers[`${s.name}__${i}`] })
            ));
            const res = await fetch("http://localhost:4000/api/surveys/submit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ user_id: user.user_id, period_id: currentPeriod.period_id, responses }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.message);
            setSubmitted(prev => ({ ...prev, [currentPeriod.period_id]: true }));
            setAnswers({});
            const next = activeIdx + 1;
            if (next < periods.length) setActiveIdx(next);
        } catch (err) { setError(err.message || "Submission failed."); }
        finally { setSubmitting(false); }
    };

    const username = user?.full_name || "User";

    if (loading) return (
        <Layout username={username}>
            <div className="survey-loading">Loading surveys…</div>
        </Layout>
    );

    if (periods.length === 0 || periods.every(p => submitted[p.period_id]))
        return (
            <Layout username={username}>
                <div className="survey-done-all">
                    <div className="survey-done-icon">✅</div>
                    <h2>{periods.length === 0 ? "No pending surveys" : "All surveys submitted"}</h2>
                    <p>{periods.length === 0 ? "You have no pending annual surveys." : "Your responses have been recorded. Thank you!"}</p>
                </div>
            </Layout>
        );

    return (
        <Layout username={username}>
            <div className="survey-page">

                {/* ── Tabs ── */}
                <div className="survey-tabs">
                    {periods.map((p, idx) => {
                        const m = SURVEY_META[p.survey_type];
                        return (
                            <button key={p.period_id}
                                className={`survey-tab ${activeIdx === idx ? "active" : ""}`}
                                onClick={() => { setActiveIdx(idx); setAnswers({}); }}>
                                {m.title}
                                {submitted[p.period_id] && <span className="tab-check"> ✓</span>}
                            </button>
                        );
                    })}
                </div>

                {submitted[currentPeriod?.period_id] ? (
                    <div className="survey-done-single">
                        ✅ <strong>{meta.title}</strong> submitted — please complete the other survey.
                    </div>
                ) : (
                    <>
                        <div className="survey-header-box">
                            <h2>{meta.fullTitle}</h2>
                            <p>Rate each item from 1 (Very Dissatisfied) to 5 (Very Satisfied).</p>
                        </div>

                        <div className="survey-progress">
                            <div className="survey-progress-meta">
                                <span>{answeredItems} of {totalItems} answered</span>
                                <span>{progress}%</span>
                            </div>
                            <div className="survey-progress-track">
                                <div className="survey-progress-fill" style={{ width: `${progress}%` }} />
                            </div>
                        </div>

                        {meta.scales.map(scale => (
                            <div key={scale.name} className="survey-subscale">
                                <div className="survey-subscale-title">{scale.name}</div>
                                <table className="survey-table">
                                    <thead>
                                        <tr>
                                            <th className="col-question">Item</th>
                                            {SCALE_LABELS.map((l, i) => <th key={i} className="col-rating">{l}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {scale.items.map((item, itemIdx) => {
                                            const val = answers[`${scale.name}__${itemIdx}`];
                                            return (
                                                <tr key={itemIdx} className={val !== undefined ? "answered" : ""}>
                                                    <td className="col-question">{item}</td>
                                                    {[1, 2, 3, 4, 5].map(v => (
                                                        <td key={v} className="col-rating">
                                                            <input type="radio" className="survey-radio"
                                                                name={`${scale.name}__${itemIdx}`} value={v}
                                                                checked={val === v}
                                                                onChange={() => setAnswer(scale.name, itemIdx, v)} />
                                                        </td>
                                                    ))}
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ))}

                        {error && <div className="survey-error">{error}</div>}

                        <div className="survey-submit-row">
                            {answeredItems < totalItems && (
                                <span className="survey-remaining">{totalItems - answeredItems} items remaining</span>
                            )}
                            <button className="survey-submit-btn" onClick={handleSubmit}
                                disabled={answeredItems < totalItems || submitting}>
                                {submitting ? "Submitting…" : "Submit survey"}
                            </button>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}