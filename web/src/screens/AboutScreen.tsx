import { useT } from '../lib/i18n';

/**
 * The philosophy page: what the system is, how to approach each part, and the
 * ground rules. Written for a first-time user; linked from Progress.
 */
const AboutScreen = () => {
  const { t } = useT();
  return (
  <div>
    <h1 className="page-title">{t('About')}</h1>
    <p className="page-sub">{t('How this works, and how to get the most out of it.')}</p>

    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('💪 The system')}</div>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>
        {t("Every workout is intervals: 30 seconds of work, 30 seconds of rest, 4 rounds per circuit. No equipment beyond a chair, a wall, and a towel, so you can do the whole program in a hotel room. Programs run in cycles and repeat, so there is no finish line to fall off of. The first round of every circuit is your warm-up; just start slower.")}
      </p>
    </div>

    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('🎯 Effort: your best, honestly')}</div>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>
        {t("Do each 30 seconds at your best ability, not anyone else's pace. Quality beats quantity: full, honest reps for 30 seconds beat sloppy ones for 45. If you need to slow down mid-interval, slow down; if a move hurts (pain, not effort-burn), skip it and move on.")}
      </p>
    </div>

    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('⏸️ Pause anytime')}</div>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>
        {t("Life interrupts. Pause the timer and come back. Even if the app closes or the phone reboots, your position in the circuit is saved and you resume right where you stopped. A day checks off automatically when you genuinely work through its circuits; you can also tick a day by hand on the calendar.")}
      </p>
    </div>

    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('🛌 Rest days count')}</div>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>
        {t("Rest days are part of the program, not a gap in it. Muscle is built in recovery. They never break your streak: it only breaks when you skip an actual training day.")}
      </p>
    </div>

    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('🍽️ The meal plan is optional')}</div>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>
        {t("Nutrition gives you principles first (protein at every meal, mostly whole foods, no liquid calories) and a spelled-out meal template only if you want one. You don't have to follow the template. The diet that works is the one you stick to; keto, fasting, or normal meals all work if the principles are met.")}
      </p>
    </div>

    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('📈 Levels and switching')}</div>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>
        {t("Lean and Bulk are the starting programs; Lean II and Bulk II bring harder movements at the same 30/30 timing, in shorter sessions. Graduate when Level I stops challenging you, usually after 2 full cycles. You can browse any calendar freely, but changing your active program is done from the Progress tab: finishing cycles beats hopping between plans.")}
      </p>
    </div>

    <div className="card">
      <div style={{ fontWeight: 800, marginBottom: 6 }}>{t('📸 Check-ins & privacy')}</div>
      <p style={{ margin: 0, lineHeight: 1.55, fontSize: 14 }}>
        {t("Monthly progress photos (front, back, both sides) get an honest AI comparison against your baseline. All of your data (photos, workouts, measurements) is private to your account and visible to no one else.")}
      </p>
    </div>

    <p className="muted" style={{ fontSize: 11, textAlign: 'center', marginTop: 12 }}>
      {t("General fitness guidance for healthy adults, not medical advice. If you have a condition or an injury, check with a professional first.")}
    </p>
  </div>
  );
};

export default AboutScreen;
