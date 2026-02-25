import { type Project, stageLabel, type StageKey } from './useProjectStore';

const STAGE_ORDER: StageKey[] = ['flow', 'tone', 'rise', 'fuse', 'lens'];

const STAGE_ICONS: Record<StageKey, string> = {
    flow: '🏗️', tone: '🎨', rise: '🏠', fuse: '🎭', lens: '📸',
};
const STAGE_COLORS: Record<StageKey, string> = {
    flow: '#528A42', tone: '#C08018', rise: '#8B5E2A', fuse: '#B04428', lens: '#3458AA',
};
const STAGE_DESC: Record<StageKey, string> = {
    flow: '공간 조닝 (Space Zoning)',
    tone: '컬러링 & 재질 (Coloring & Materials)',
    rise: '아이소메트릭 3D (Isometric 3D View)',
    fuse: '믹스보드 & 컨셉 (Style Transfer)',
    lens: 'AI 렌더링 (Final Rendering)',
};

export function generateProjectReportHTML(project: Project): string {
    const now = new Date().toLocaleDateString('ko-KR', {
        year: 'numeric', month: 'long', day: 'numeric',
    });
    const completedStages = STAGE_ORDER.filter(s => !!project.stages[s]?.completedAt);

    const stagesSections = STAGE_ORDER.map(s => {
        const stage = project.stages[s];
        const done = !!stage?.completedAt;
        const color = STAGE_COLORS[s];
        const images = stage?.resultImages || [];
        const prompt = stage?.prompt || '';
        const alt = stage?.selectedAlt || '';

        return `
    <section class="stage-section ${done ? 'done' : 'pending'}">
      <div class="stage-header" style="border-left: 5px solid ${color};">
        <span class="stage-icon">${STAGE_ICONS[s]}</span>
        <div>
          <h2 style="color:${color};">${stageLabel[s]} — ${STAGE_DESC[s]}</h2>
          <span class="stage-status">${done ? `✓ 완료 · ${new Date(stage!.completedAt!).toLocaleDateString('ko-KR')}` : '진행 중'}</span>
        </div>
      </div>

      ${alt ? `<div class="selected-alt">최종 선택안: <strong>${alt}</strong></div>` : ''}

      ${images.length > 0 ? `
      <div class="images-grid">
        ${images.map((img, i) => `
          <figure>
            <img src="${img}" alt="${stageLabel[s]} 결과물 ${i + 1}" />
            <figcaption>${stageLabel[s]} 결과물 ${i + 1}</figcaption>
          </figure>
        `).join('')}
      </div>` : ''}

      ${prompt ? `
      <details>
        <summary>AI 프롬프트 보기</summary>
        <pre class="prompt-block">${prompt.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
      </details>` : ''}

      ${!done && images.length === 0 && !prompt
                ? '<p class="empty-note">이 단계는 아직 진행되지 않았습니다.</p>'
                : ''}
    </section>`;
    }).join('\n');

    return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${project.name} — IN-TE-REAL 프로젝트 보고서</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: 'Apple SD Gothic Neo', 'Malgun Gothic', sans-serif; background: #f7f6f2; color: #2a2a2a; line-height: 1.65; }
    .cover {
      background: linear-gradient(135deg, #1a2035 0%, #2d3a5a 60%, #3d4f70 100%);
      color: #fff; padding: 72px 60px; min-height: 260px;
    }
    .cover-brand { font-size: 12px; font-weight: 800; letter-spacing: 0.18em; opacity: 0.6; margin-bottom: 20px; text-transform: uppercase; }
    .cover h1 { font-size: 36px; font-weight: 900; line-height: 1.2; margin-bottom: 10px; }
    .cover-meta { display: flex; gap: 28px; margin-top: 24px; flex-wrap: wrap; }
    .cover-meta div { font-size: 13px; opacity: 0.8; }
    .cover-meta strong { font-size: 14px; opacity: 1; display: block; margin-bottom: 2px; color: #fff; }
    .progress-bar-wrap { padding: 28px 60px; background: #fff; border-bottom: 1px solid #e8e4dc; }
    .progress-label { font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: #888; margin-bottom: 10px; }
    .progress-stages { display: flex; gap: 8px; }
    .progress-stage { flex: 1; padding: 8px 10px; border-radius: 8px; text-align: center; font-size: 11px; font-weight: 700; }
    .progress-stage.done    { color: #fff; }
    .progress-stage.pending { background: #f0eeea; color: #aaa; }
    .content { max-width: 860px; margin: 0 auto; padding: 40px 32px 80px; }
    .stage-section { background: #fff; border-radius: 14px; margin-bottom: 28px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.06); }
    .stage-section.pending { opacity: 0.65; }
    .stage-header { display: flex; align-items: center; gap: 16px; padding: 20px 24px; background: #fafaf8; border-bottom: 1px solid #eeeae4; }
    .stage-icon { font-size: 28px; }
    .stage-header h2 { font-size: 17px; font-weight: 800; margin-bottom: 3px; }
    .stage-status { font-size: 11px; color: #888; }
    .selected-alt { padding: 10px 24px; background: #f5f3ee; font-size: 13px; border-bottom: 1px solid #eeeae4; }
    .images-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 14px; padding: 20px 24px; }
    figure img { width: 100%; border-radius: 8px; display: block; object-fit: cover; }
    figcaption { font-size: 10px; color: #aaa; text-align: center; margin-top: 5px; }
    details { padding: 16px 24px 20px; border-top: 1px solid #eeeae4; }
    summary { font-size: 12px; font-weight: 700; color: #888; cursor: pointer; padding: 6px 0; }
    .prompt-block { font-size: 11px; font-family: 'Menlo', 'Monaco', monospace; background: #1a1a2e; color: #a8d8a0; padding: 14px 16px; border-radius: 8px; margin-top: 10px; white-space: pre-wrap; word-break: break-all; line-height: 1.55; }
    .empty-note { font-size: 12px; color: #bbb; padding: 20px 24px; }
    .footer { text-align: center; font-size: 11px; color: #bbb; margin-top: 48px; padding-top: 24px; border-top: 1px solid #e8e4dc; }
    @media print {
      body { background: #fff; }
      .stage-section { box-shadow: none; border: 1px solid #ddd; }
    }
  </style>
</head>
<body>
  <div class="cover">
    <div class="cover-brand">IN-TE-REAL · Interior Innovation in Real-time</div>
    <h1>${project.name}</h1>
    <div class="cover-meta">
      <div><strong>건물 용도</strong>${project.usage}</div>
      ${project.client ? `<div><strong>의뢰인</strong>${project.client}</div>` : ''}
      ${project.location ? `<div><strong>위치</strong>${project.location}</div>` : ''}
      <div><strong>진행 단계</strong>${completedStages.length}/5 완료</div>
      <div><strong>보고서 작성일</strong>${now}</div>
    </div>
  </div>

  <div class="progress-bar-wrap">
    <div class="progress-label">파이프라인 진행 현황</div>
    <div class="progress-stages">
      ${STAGE_ORDER.map(s => {
        const done = !!project.stages[s]?.completedAt;
        return `<div class="progress-stage ${done ? 'done' : 'pending'}" style="${done ? `background:${STAGE_COLORS[s]};` : ''}">
          ${STAGE_ICONS[s]} ${stageLabel[s]}
        </div>`;
    }).join('')}
    </div>
  </div>

  <div class="content">
    ${stagesSections}
    <div class="footer">
      보고서 생성: IN-TE-REAL AI Orchestration Dashboard · ${now}
    </div>
  </div>
</body>
</html>`;
}

export function downloadReportHTML(project: Project) {
    const html = generateProjectReportHTML(project);
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${project.name.replace(/[^a-zA-Z0-9가-힣]/g, '_')}_보고서.html`;
    a.click();
    URL.revokeObjectURL(url);
}
