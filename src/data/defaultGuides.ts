import {
  ServiceMeta,
  PlatformMeta,
  ContextMeta,
  ToneLevelMeta,
  ComponentGuideRule,
  CustomGuideRule,
  TerminologyRule,
  SimilarCase,
  UIComponentType,
} from '../types';

export const SERVICES_CONFIG: Record<string, ServiceMeta> = {
  banking: {
    id: 'banking',
    title: '금융 / 뱅킹 서비스',
    subtitle: '조회·이체 / 상품가입 / 인증 / 보안',
    description: '표준 UX 라이팅 원칙 기반. 정확하고 쉬운 금융 언어, 신뢰감, 오인지 방지, 직관적인 버튼 CTA 및 규정 준수',
    iconName: 'Building',
    badge: 'Finance & Trust',
  },
  broadcast: {
    id: 'broadcast',
    title: '방송 / 미디어 서비스',
    subtitle: 'TV / OTT / 실시간 채널 / VOD',
    description: 'VOD 탐색, 실시간 채널, 편성표, 시청 예약, 구독 및 결제/해지, 이어보기 등 미디어 경험 최적화',
    iconName: 'Tv',
    badge: 'Media & OTT',
  },
  commerce: {
    id: 'commerce',
    title: '커머스형 홈페이지',
    subtitle: '직영몰 / 가입·결제 / 쇼핑몰',
    description: '회원가입/로그인 유도, 장바구니, 결제/주문서, 프로모션 배너, 품절/재입고, 반품/환불 등 전환율(CVR) 극대화',
    iconName: 'ShoppingBag',
    badge: 'Direct Mall & CVR',
  },
  intro: {
    id: 'intro',
    title: '소개형 / 고객센터',
    subtitle: '고객센터 / 회사·기업소개 / 브랜드',
    description: '고객센터 1:1 문의, 회사 소개/IR, 브랜드 비전, 서비스 상세 안내, FAQ 등 신뢰감과 전문성 전달',
    iconName: 'Building2',
    badge: 'Brand & Support',
  },
  custom: {
    id: 'custom',
    title: '커스텀 서비스 정의',
    subtitle: '직접 입력한 비즈니스 모델 & 도메인',
    description: '사용자가 직접 정의한 서비스 맥락과 자체 브랜드 보이스에 맞춘 맞춤형 검수',
    iconName: 'Sliders',
    badge: 'Custom Domain',
  },
};

export const PLATFORMS_CONFIG: Record<string, PlatformMeta> = {
  mobile: {
    id: 'mobile',
    title: 'Mobile App/Web',
    subtitle: '터치 기반 · Small Screen',
    constraints: '엄지손가락 터치 동선 최적화. 좁은 화면 줄바꿈 및 글자 수 제약. 한눈에 들어오는 직관적인 핵심 버튼 CTA.',
    iconName: 'Smartphone',
  },
  pc: {
    id: 'pc',
    title: 'PC Web',
    subtitle: '마우스/키보드 기반 · Full Screen',
    constraints: '넓은 뷰포트 활용. 상세한 안내와 툴팁 호버 지원. 정밀한 탐색 동선과 계층적 정보 구조 제공.',
    iconName: 'Laptop',
  },
  tv: {
    id: 'tv',
    title: 'TV / 대화면',
    subtitle: '리모컨 기반 · Lean-back 환경',
    constraints: '3m 이상 거리 시인성 확보. 최대 1~2줄 이내의 극도로 간결한 문장. 4방향 리모컨 포커스에 적합한 명확한 액션 레이블(확인, 다시시도, 바로보기 등).',
    iconName: 'MonitorPlay',
  },
};

export const CONTEXTS_CONFIG: Record<string, ContextMeta> = {
  guide: {
    id: 'guide',
    title: '안내문 / 정보 제공',
    description: '기능 이용 방법, 상태 안내, 정책 및 이용 수칙 등 유저가 다음 단계를 쉽게 이해하도록 돕는 문구',
    defaultToneLevel: 2,
    iconName: 'Info',
  },
  error: {
    id: 'error',
    title: '에러 / 경고 / 장애',
    description: '결제 실패, 네트워크 오류, 필수값 누락 등 불안을 해소하고 구체적인 해결 행동을 제시하는 문구',
    defaultToneLevel: 2,
    iconName: 'AlertTriangle',
  },
  promotion: {
    id: 'promotion',
    title: '프로모션 / 마케팅 / 가입·결제 유도',
    description: '이벤트 배너, 첫 구매 혜택, 멤버십 가입 유도 등 즉각적인 참여와 행동을 유도하는 매력적인 카피',
    defaultToneLevel: 3,
    iconName: 'Sparkles',
  },
  confirmation: {
    id: 'confirmation',
    title: '확인 / 취소 / 탈퇴',
    description: '구독 해지, 삭제 확인, 결제 최종 승인 등 사용자 의도를 재확인하고 혜택 손실을 정중히 짚어주는 문구',
    defaultToneLevel: 1,
    iconName: 'HelpCircle',
  },
  empty: {
    id: 'empty',
    title: '빈 화면 / 검색 결과 없음',
    description: '찜 목록 비어있음, 검색 결과 없음 등 사용자에게 다음 탐색 행동(추천 콘텐츠, 인기 키워드)을 제안하는 문구',
    defaultToneLevel: 2,
    iconName: 'Inbox',
  },
};

export const TONE_LEVELS_CONFIG: Record<number, ToneLevelMeta> = {
  1: {
    level: 1,
    name: 'Level 1: 매우 정중 / 격식체 (Formal)',
    description: '신뢰성과 공공성, 규정 안내에 적합한 격식 있는 정중체. (~하십시오, ~바랍니다, ~됩니다)',
    example: '안전한 금융 거래를 위해 본인 인증을 진행해 주시기 바랍니다.',
    endingPattern: '~하십시오, ~바랍니다, ~됩니다',
  },
  2: {
    level: 2,
    name: 'Level 2: 친절 / 표준 해요체 (Polite & Friendly)',
    description: '가장 널리 쓰이는 표준 UX 라이팅. 친절하면서도 명확하게 사용자를 이끄는 어조. (~해요, ~해 주세요, ~확인해 보세요)',
    example: '안전한 이용을 위해 본인 인증을 완료해 주세요.',
    endingPattern: '~해요, ~해 주세요, ~확인해 보세요',
  },
  3: {
    level: 3,
    name: 'Level 3: 직관 / 간결 명사·동사형 (Concise & Action)',
    description: '버튼, 탭, TV 리모컨, 모바일 상단 바에 최적화된 불필요한 조사/어미 생략형 문구. (~하기 지양, 명사형 종결)',
    example: '본인 인증 완료 후 계속',
    endingPattern: '명사형 종결 (확인, 조회, 동의), CTA 간결형',
  },
  4: {
    level: 4,
    name: 'Level 4: 친근 / 공감·대화형 (Empathetic & Casual)',
    description: '온보딩, 축하, 빈 화면, 감성적 인터랙션에서 유저의 기분을 북돋우는 따뜻한 대화체. (~해 볼까요?, ~함께해요!)',
    example: '안전한 시작을 위해 잠깐 본인 인증을 해볼까요?',
    endingPattern: '~해 볼까요?, ~함께해요, ~알려드릴게요!',
  },
};

// 표준 UX 라이팅 원칙 기반 컴포넌트별 세부 가이드
export const DEFAULT_COMPONENT_GUIDES: Record<UIComponentType, ComponentGuideRule> = {
  button: {
    componentType: 'button',
    title: '버튼 (Button)',
    subtitle: 'Single / Dual / 하단 고정 CTA',
    badge: 'Single & CTA',
    charLimitRule: {
      singleMax: 4, // 공백 제외 기본 4자 이내
      ctaMax: 12, // CTA 행동 유도 시 최대 12자 (4어절 이내)
      unitDescription: '공백 제외 4자 이내의 한 단어 (CTA는 최대 12자)',
      notes: '되도록 4글자 이내의 명사형 한 단어로 씁니다. 단, 구체적 행동 유도시 12자/4어절까지 허용합니다.',
    },
    toneEndingRule: {
      preferredForm: '명사형으로 간결하게 종결',
      endingPattern: '확인, 완료, 조회, 다음, 본인인증, 이체하기 대신 이체',
      forbiddenPatterns: ['~하기', '~하시겠습니까', '~해주세요', '확인하기', '취소하기', '로그인하기', '다음에 하기'],
      description: "[확인], [취소], [로그인], [다음에] 버튼에는 어떠한 경우에도 '~하기'를 붙이지 않습니다.",
    },
    corePrinciples: [
      '버튼은 명사형으로 간결하게 씁니다.',
      '되도록 4글자 이내의 한 단어로 씁니다. (확인, 조회, 다음, 본인인증)',
      '고객 행동 유도를 위해 버튼에 구체적 정보를 담을 경우 12글자, 4어절 이내까지 허용합니다.',
      '[확인], [취소], [로그인], [다음에] 버튼에는 어떠한 경우에도 "~하기"를 붙이지 않습니다. (변별력 저하 방지)',
      'Dual 버튼 사용 시 부정/취소 액션은 좌측, 긍정/확인 액션은 우측에 배치합니다.',
    ],
    goodExamples: [
      { text: '확인', note: '가장 명확하고 표준적인 기본 버튼' },
      { text: '본인인증', note: '4자 이내 명사형으로 목적 명확' },
      { text: '인증서 발급받기', note: '구체적 CTA 행동 유도 (12자 이내)' },
      { text: '3,000원 송금', note: '금액 및 핵심 액션 명확화' },
    ],
    badExamples: [
      { text: '확인하기', reason: "'~하기' 남용으로 간결성을 해침", fix: '확인' },
      { text: '로그인하기', reason: "불필요한 접미사 '~하기' 사용", fix: '로그인' },
      { text: '본 서비스를 이용하기 위한 약관에 동의합니다', reason: '버튼 내 장문 문장형 작성', fix: '약관 동의' },
      { text: '클릭하여 다음으로 넘어가세요', reason: '지시형 및 글자 수 초과', fix: '다음' },
    ],
  },
  bottom_sheet: {
    componentType: 'bottom_sheet',
    title: '바텀시트 (Bottom Sheet)',
    subtitle: '선택 옵션 / 상세 조건 / 간이 프로세스',
    badge: 'Bottom Sheet',
    charLimitRule: {
      singleMax: 18, // 타이틀 기준 18자 이내
      maxLines: 2,
      unitDescription: '타이틀 공백 제외 18자 이내, 본문 2줄 이내',
      notes: '한 화면에서 빠르게 선택하고 닫을 수 있도록 직관적인 타이틀과 옵션 리스트를 제공합니다.',
    },
    toneEndingRule: {
      preferredForm: '명사형 타이틀 또는 정중한 청유/해요체',
      endingPattern: '~를 선택해 주세요, ~확인, 명사형 목록',
      forbiddenPatterns: ['~해라', '~하십시오(과도한경어)', '알림'],
      description: '바텀시트의 목적(선택/확인)을 명확한 타이틀로 즉시 전달합니다.',
    },
    corePrinciples: [
      '바텀시트 타이틀은 유저가 수행해야 할 단일 행동을 명확히 정의합니다.',
      '옵션 항목은 명사형으로 통일하며 서술형 문장을 지양합니다.',
      '닫기 또는 취소 버튼은 상단 X 버튼 또는 하단 버튼으로 명확히 배치합니다.',
    ],
    goodExamples: [
      { text: '출금 계좌를 선택해 주세요', note: '행동 유도 타이틀' },
      { text: '인증 방식 선택', note: '간결한 명사형 타이틀' },
    ],
    badExamples: [
      { text: '해당 기능을 이용하시려면 아래에서 선택하십시오', reason: '장황한 문장 및 딱딱한 어조', fix: '이용 방법 선택' },
    ],
  },
  popup: {
    componentType: 'popup',
    title: '팝업 / 모달 (Popup / Modal)',
    subtitle: '중요 확인 / 시스템 경고 / 프로세스 차단',
    badge: 'Modal & Alert',
    charLimitRule: {
      singleMax: 16, // 타이틀 16자 이내
      maxLines: 3, // 본문 3줄 이내
      unitDescription: '타이틀 16자 이내 (1줄), 본문 3줄/60자 이내',
      notes: '타이틀만 읽고도 상황을 80% 이상 이해할 수 있도록 핵심 결론을 먼저 씁니다.',
    },
    toneEndingRule: {
      preferredForm: '타이틀: 두괄식 결론형 / 본문: 친절한 해요체',
      endingPattern: '~할까요?, ~해 주세요, ~되었습니다',
      forbiddenPatterns: ['경고!', '에러 발생', '~요망합니다', '~하시겠습니까?(구태의연)'],
      description: "단순 '알림', '경고' 대신 상황을 구체적으로 설명하는 타이틀을 사용합니다.",
    },
    corePrinciples: [
      "타이틀에 '알림', '안내', '경고' 같은 무의미한 단어를 단독으로 쓰지 않습니다.",
      '본문은 [발생 원인] + [해결 방법] 순으로 2~3줄 이내로 간결히 서술합니다.',
      '버튼 레이블은 [예/아니오] 대신 [삭제/취소], [로그아웃/유지]처럼 수행 결과를 명확히 씁니다.',
    ],
    goodExamples: [
      { text: '계좌 비밀번호를 3회 잘못 입력했어요', note: '두괄식 원인 제시' },
      { text: '작성 중인 글을 삭제할까요?', note: '명확한 질문형 확인' },
    ],
    badExamples: [
      { text: '시스템 에러', reason: '무의미하고 불안을 주는 타이틀', fix: '일시적인 오류가 발생했어요' },
      { text: '정말로 탈퇴를 진행하시겠습니까?', reason: '구태의연한 표현', fix: '회원을 탈퇴할까요?' },
    ],
  },
  label: {
    componentType: 'label',
    title: '레이블 / 태그 / 배지 (Label & Badge)',
    subtitle: '상태 표시 / 카테고리 / 메타 정보',
    badge: 'Label & Badge',
    charLimitRule: {
      singleMax: 6, // 공백 제외 6자 이내
      unitDescription: '공백 제외 2~6자 이내의 단일 명사',
      notes: '배지/태그 안에서는 줄바꿈이 일어나지 않도록 2~6자의 짧은 명사형을 씁니다.',
    },
    toneEndingRule: {
      preferredForm: '단일 명사 또는 상태 형용사',
      endingPattern: '진행중, 완료, 대기, 추천, 신규, 마감임박',
      forbiddenPatterns: ['~하고 있습니다', '~중입니다', '~완료됨'],
      description: '불필요한 어미를 모두 제거한 순수 명사형 표기',
    },
    corePrinciples: [
      '텍스트가 태그 영역을 벗어나거나 2줄로 줄바꿈되지 않도록 엄격히 글자 수를 제한합니다.',
      '상태를 표현할 때는 색상과 함께 직관적인 명사(완료, 처리중, 취소)를 씁니다.',
    ],
    goodExamples: [
      { text: '신규', note: '간결한 배지' },
      { text: '인증완료', note: '상태 명확' },
      { text: '혜택', note: '핵심 명사' },
    ],
    badExamples: [
      { text: '현재 처리 중입니다', reason: '문장형 배지로 줄바꿈 위험', fix: '처리중' },
      { text: '이벤트 대상자임', reason: '불완전한 어미', fix: '이벤트 대상' },
    ],
  },
  tooltip: {
    componentType: 'tooltip',
    title: '툴팁 / 도움말 (Tooltip)',
    subtitle: '용어 설명 / 부가 안내 / 도움말 아이콘 팝오버',
    badge: 'Tooltip & Help',
    charLimitRule: {
      singleMax: 40, // 40자 이내
      maxLines: 2,
      unitDescription: '공백 포함 40자 이내 (최대 2줄)',
      notes: '시야를 가리지 않도록 필수적인 설명만 2줄 이내로 압축합니다.',
    },
    toneEndingRule: {
      preferredForm: '간결한 해요체 또는 명사형 요약',
      endingPattern: '~를 의미해요, ~할 수 있어요, ~안내',
      forbiddenPatterns: ['~참조하시기 바랍니다', '~요함'],
      description: '친절하고 쉬운 어조로 전문 용어를 풀어서 설명합니다.',
    },
    corePrinciples: [
      '어려운 금융/기술 전문 용어를 누구나 이해할 수 있는 쉬운 일상어로 풀어줍니다.',
      '사용자가 행동을 결정하는 데 꼭 필요한 1가지 핵심 정보만 담습니다.',
    ],
    goodExamples: [
      { text: '영업일 기준 2~3일 이내에 입금돼요.', note: '핵심 일정 안내' },
      { text: '비밀번호는 영문+숫자 8자리 이상이어야 해요.', note: '유효성 규칙 간결 안내' },
    ],
    badExamples: [
      { text: '해당 항목에 대한 자세한 법적 규정은 약관 제4조를 참조 요망', reason: '불친절하고 어려운 행정적 문구', fix: '자세한 기준은 이용약관에서 확인할 수 있어요.' },
    ],
  },
  textfield: {
    componentType: 'textfield',
    title: '텍스트 필드 (Text Field)',
    subtitle: '라벨 / 플레이스홀더 / 헬퍼 텍스트 / 에러 메시지',
    badge: 'Input & Form',
    charLimitRule: {
      singleMax: 20,
      unitDescription: '라벨 10자 이내, 플레이스홀더 20자 이내',
      notes: '입력할 값의 형식(Format)이나 예시를 플레이스홀더에 직관적으로 보여줍니다.',
    },
    toneEndingRule: {
      preferredForm: '라벨: 명사형 / 플레이스홀더: 예시 또는 행동 유도',
      endingPattern: '예) 010-1234-5678, 이름을 입력해 주세요',
      forbiddenPatterns: ['값을 넣으시오', '~기입 요망'],
      description: '입력 유도 시 친절한 해요체 또는 실시간 예시 형식 제공',
    },
    corePrinciples: [
      "필드 라벨은 명사형으로 씁니다 (예: '휴대폰 번호', '이체 금액').",
      "플레이스홀더는 입력 형식의 구체적 예시를 제공합니다 (예: '숫자만 입력').",
      "에러 발생 시 무엇이 잘못되었는지와 올바른 형식을 함께 알려줍니다.",
    ],
    goodExamples: [
      { text: '계좌번호를 입력해 주세요 (- 제외)', note: '형식 명시 플레이스홀더' },
      { text: '비밀번호는 영문, 숫자 조합 8자 이상이어야 해요', note: '실시간 헬퍼 텍스트' },
    ],
    badExamples: [
      { text: '금액란 (필수 기재 요망)', reason: '딱딱한 한자어', fix: '보낼 금액' },
    ],
  },
  toast: {
    componentType: 'toast',
    title: '토스트 (Toast)',
    subtitle: '수행 결과 피드백 / 일시적 상태 알림',
    badge: 'Toast Feedback',
    charLimitRule: {
      singleMax: 25, // 25자 이내 1줄
      maxLines: 1,
      unitDescription: '공백 포함 25자 이내 (반드시 1줄)',
      notes: '2~3초 후 자동으로 사라지므로 1줄로 한눈에 읽혀야 합니다.',
    },
    toneEndingRule: {
      preferredForm: '완료/결과 중심의 해요체 또는 과거형 종결',
      endingPattern: '~했어요, ~되었습니다, ~복사 완료',
      forbiddenPatterns: ['~성공적으로 완료되었습니다(장황)', '~확인하시기 바랍니다'],
      description: '결과를 즉시 인지할 수 있는 명쾌한 완료 어조',
    },
    corePrinciples: [
      '토스트는 1초 안에 인지되어야 하므로 절대 2줄로 줄바꿈되지 않도록 씁니다.',
      "'성공적으로', '정상적으로' 등 군더더기 부사를 삭제합니다.",
    ],
    goodExamples: [
      { text: '계좌번호가 복사되었어요.', note: '간결하고 명확' },
      { text: '즐겨찾기에 추가했어요.', note: '1줄 즉시 인지' },
      { text: '인터넷 연결을 확인해 주세요.', note: '간결한 경고' },
    ],
    badExamples: [
      { text: '해당 클립보드로 계좌번호가 성공적으로 복사 완료되었습니다.', reason: '불필요한 부사 및 2줄 초과', fix: '계좌번호를 복사했어요.' },
    ],
  },
  notice_error: {
    componentType: 'notice_error',
    title: '헤드 / 완료 / 거절 / 오류 / 이탈방지 메시지',
    subtitle: '화면 메인 타이틀, 이체 완료, 거절 사유, 이탈 방지',
    badge: 'Head & Status',
    charLimitRule: {
      singleMax: 30,
      maxLines: 2,
      unitDescription: '메인 헤드 20자 이내, 상세 30자 이내',
      notes: '화면 최상단에서 현재 상태나 프로세스 결과를 가장 명확하게 전달합니다.',
    },
    toneEndingRule: {
      preferredForm: '완료/거절 시 명확한 결과 안내 + 친절한 해요체',
      endingPattern: '~가 완료되었어요, ~할 수 없어요, ~혜택을 유지할까요?',
      forbiddenPatterns: ['처리 불가', '에러 코드: ERR_01', '회원님의 귀책사유'],
      description: '고객에게 책임을 전가하지 않고, 해결 가능한 대안을 함께 제시합니다.',
    },
    corePrinciples: [
      '완료 화면: 금액, 대상, 일시 등 핵심 결과를 최상단에 요약합니다.',
      '거절/오류 화면: 거절 사유를 명확히 밝히고, 고객이 취할 수 있는 다음 단계를 안내합니다.',
      '이탈 방지: 해지/취소 시 잃게 되는 핵심 혜택을 명확히 짚어줍니다.',
    ],
    goodExamples: [
      { text: '홍길동님에게 50,000원을 보냈어요', note: '완료 화면 명확한 결과' },
      { text: '1일 이체 한도를 초과했어요. 한도를 상향해 보세요.', note: '오류 원인 + 해결 행동' },
      { text: '지금 나가시면 작성 중인 내용이 사라져요', note: '이탈 방지 안내' },
    ],
    badExamples: [
      { text: '이체 불가 (오류 코드 9901)', reason: '불안감을 조성하고 해결책 없음', fix: '계좌 잔액이 부족해요. 잔액을 확인해 주세요.' },
    ],
  },
  precaution: {
    componentType: 'precaution',
    title: '유의사항 / 안내각주 (Precaution)',
    subtitle: '법적 고지 / 상품 유의사항 / 약관 상세',
    badge: 'Legal & Notice',
    charLimitRule: {
      singleMax: 60,
      unitDescription: '문장당 40~60자 이내의 불릿 포인트',
      notes: '긴 약관이라도 箇條書(불릿) 형식으로 쪼개어 가독성을 높입니다.',
    },
    toneEndingRule: {
      preferredForm: '명확한 설명체 또는 정중체',
      endingPattern: '~됩니다, ~않습니다, ~부과될 수 있습니다',
      forbiddenPatterns: ['~해야 함(반말투)', '~임(불완전)'],
      description: '권리와 의무를 명확히 하되, 어려운 법률 용어를 순화하여 설명합니다.',
    },
    corePrinciples: [
      '복잡한 약관과 주의사항은 불릿 포인트(•)로 한 문장씩 분리합니다.',
      '수수료 발생, 혜택 소멸 등 고객에게 불리한 조항은 굵은 글씨나 강조 처리합니다.',
      '어려운 한자어(차감, 기재, 당사, 귀하)를 쉬운 순화어로 대체합니다.',
    ],
    goodExamples: [
      { text: '• 중도 해지 시 이자가 지급되지 않을 수 있습니다.', note: '명확한 불릿 고지' },
      { text: '• 1인당 최대 3개 계좌까지 개설할 수 있어요.', note: '이해하기 쉬운 수치 안내' },
    ],
    badExamples: [
      { text: '본 상품은 중도해지시 기지급된 이자의 환수가 이루어질 수 있음을 양지바람', reason: '극심한 한자어 및 관공서 어투', fix: '• 중도에 해지하면 이미 받은 이자가 차감될 수 있습니다.' },
    ],
  },
  general: {
    componentType: 'general',
    title: '일반 본문 / 자유 텍스트 (General Copy)',
    subtitle: '일반 안내문 / 본문 콘텐츠 / 마케팅 카피',
    badge: 'General Copy',
    charLimitRule: {
      singleMax: 50,
      unitDescription: '문장당 50자 이내',
      notes: '한 문장에 하나의 정보만 담는 1문장 1메시지 원칙을 준수합니다.',
    },
    toneEndingRule: {
      preferredForm: '상황에 맞는 표준 해요체',
      endingPattern: '~해요, ~해 주세요',
      forbiddenPatterns: ['~되어집니다', '~에 관하여'],
      description: '이해하기 쉬운 친절한 일상 언어',
    },
    corePrinciples: [
      '1문장 1메시지 원칙으로 문장을 짧게 끊어 씁니다.',
      '능동태 중심의 문장 구성을 사용합니다.',
    ],
    goodExamples: [{ text: '원하는 상품을 담고 한 번에 결제해 보세요.', note: '간결한 안내' }],
    badExamples: [{ text: '상품들에 관하여 장바구니에 담아짐으로써 결제가 가능합니다.', reason: '피동태 및 번역투', fix: '장바구니에 담아 한 번에 결제할 수 있어요.' }],
  },
};

export const DEFAULT_GUIDE_RULES: CustomGuideRule[] = [
  {
    id: 'rule-btn-1',
    category: '컴포넌트규칙',
    ruleTitle: '버튼 명사형 종결 및 4글자 이내 원칙 (표준 가이드)',
    description: "Primary 버튼은 공백 제외 4글자 이내의 한 단어(확인, 조회, 다음, 본인인증)를 원칙으로 하며, 어떠한 경우에도 '~하기'를 붙이지 않습니다.",
    badExample: '확인하기 / 로그인하기 / 다음에 하기',
    goodExample: '확인 / 로그인 / 다음에',
    componentType: 'button',
  },
  {
    id: 'rule-btn-2',
    category: '글자수초과',
    ruleTitle: '행동 유도 CTA 버튼 12글자·4어절 제한',
    description: '구체적인 행동 정보를 담는 CTA 버튼의 경우에도 최대 12글자(4어절)를 초과하지 않도록 압축합니다.',
    badExample: '지금 바로 본인 인증을 진행하시고 서비스를 시작해보세요',
    goodExample: '본인인증 후 시작하기 (10자)',
    componentType: 'button',
  },
  {
    id: 'rule-popup-1',
    category: '명확성',
    ruleTitle: "팝업 타이틀에 무의미한 '알림/경고' 금지 및 두괄식 결론 제시",
    description: "팝업 제목에 단순 '알림'이나 '경고'를 배제하고, 원인이나 결론을 16자 이내로 명확하게 제시합니다.",
    badExample: '알림 (본문: 인증서 유효기간이 만료되었습니다)',
    goodExample: '인증서가 만료되었어요 (본문: 인증서를 다시 발급해 주세요)',
    componentType: 'popup',
  },
  {
    id: 'rule-toast-1',
    category: '간결성',
    ruleTitle: '토스트 메시지 공백포함 25자 이내 1줄 엄수',
    description: '토스트는 2초 후 자동 소멸되므로 2줄 줄바꿈을 금지하고, 25자 이내로 간결히 서술합니다.',
    badExample: '회원님의 클립보드로 요청하신 계좌번호가 성공적으로 복사되었습니다.',
    goodExample: '계좌번호를 복사했어요.',
    componentType: 'toast',
  },
  {
    id: 'rule-hanja-1',
    category: '간결성',
    ruleTitle: '불필요한 한자어 및 관공서식 표현 순화',
    description: "'금일', '해당', '통하여', '의하여', '기재' 등 딱딱한 한자어를 쉬운 우리말로 바꿉니다.",
    badExample: '금일 해당 계좌에 기재된 금액을 송금 요망합니다.',
    goodExample: '오늘 계좌로 금액을 보내주세요.',
  },
  {
    id: 'rule-error-1',
    category: '명확성',
    ruleTitle: '시스템 오류 코드 대신 구체적 해결 행동 제시',
    description: "'Error 500' 등 기술 용어를 배제하고, 사용자가 지금 당장 취해야 할 행동을 안내합니다.",
    badExample: '네트워크 통신 오류 (ERR_SOCKET_TIMEOUT)',
    goodExample: '인터넷 연결이 불안정해요. 와이파이를 확인하고 다시 시도해 주세요.',
  },
];

export const DEFAULT_TERMINOLOGY: TerminologyRule[] = [
  {
    id: 'term-1',
    prohibitedTerm: '확인하기',
    recommendedTerm: '확인',
    reason: "버튼 가이드: [확인], [취소], [로그인] 버튼에 '~하기' 금지",
  },
  {
    id: 'term-2',
    prohibitedTerm: '로그인하기',
    recommendedTerm: '로그인',
    reason: "버튼 가이드: 불필요한 '~하기' 접미사 배제",
  },
  {
    id: 'term-3',
    prohibitedTerm: '금일',
    recommendedTerm: '오늘',
    reason: '어려운 한자어 순화',
  },
  {
    id: 'term-4',
    prohibitedTerm: '해당',
    recommendedTerm: '이 / 그 (또는 생략)',
    reason: '불필요한 지시대명사 제거로 간결화',
  },
  {
    id: 'term-5',
    prohibitedTerm: '되어집니다',
    recommendedTerm: '됩니다 / 해요',
    reason: '이중 피동 문법 오류 교정',
  },
  {
    id: 'term-6',
    prohibitedTerm: '송금하기',
    recommendedTerm: '보내기 / 송금',
    reason: '금융 용어 친근화 및 버튼 간결화',
  },
];

export const SAMPLE_PRESETS = [
  {
    id: 'preset-banking-btn',
    title: '금융 표준 버튼 (Single/CTA)',
    service: 'banking' as const,
    platform: 'mobile' as const,
    componentType: 'button' as const,
    context: 'guide' as const,
    toneLevel: 3 as const,
    text: '본 서비스를 이용하시려면 약관에 동의하시고 로그인하기 버튼을 클릭해 주시기 바랍니다.',
  },
  {
    id: 'preset-shinhan-popup',
    title: '금융 팝업 (오류 및 해결책)',
    service: 'banking' as const,
    platform: 'mobile' as const,
    componentType: 'popup' as const,
    context: 'error' as const,
    toneLevel: 2 as const,
    text: '경고! 계좌 비밀번호 3회 오류로 인하여 인증이 차단되었습니다. 고객센터에 문의하시거나 영업점에 방문 요망.',
  },
  {
    id: 'preset-broadcast-tv',
    title: '방송 VOD 재생 오류 (TV)',
    service: 'broadcast' as const,
    platform: 'tv' as const,
    componentType: 'notice_error' as const,
    context: 'error' as const,
    toneLevel: 3 as const,
    text: '재생 중 통신 상태 불량으로 인하여 VOD 스트리밍이 중단되었습니다.\n리모컨의 확인 버튼을 눌러 이전 화면으로 회귀하시거나 재시도를 요망합니다.',
  },
  {
    id: 'preset-toast',
    title: '계좌 복사 토스트 피드백',
    service: 'banking' as const,
    platform: 'mobile' as const,
    componentType: 'toast' as const,
    context: 'guide' as const,
    toneLevel: 2 as const,
    text: '회원님의 스마트폰 클립보드로 계좌번호가 성공적으로 복사 완료되었습니다.',
  },
  {
    id: 'preset-commerce-batch',
    title: '쇼핑몰 결제 화면 전체 일괄',
    service: 'commerce' as const,
    platform: 'mobile' as const,
    componentType: 'general' as const,
    context: 'promotion' as const,
    toneLevel: 2 as const,
    text: `[화면 타이틀] 프리미엄 회원 멤버십 가입 및 결제 진행
[혜택 배너] 금일 가입 시 10,000원 상당의 쿠폰팩이 일괄 지급되어집니다.
[약관 안내] 본 약관을 숙지하지 않아 발생하는 불이익에 관하여는 당사에서 책임지지 아니함.
[확인 버튼] 결제 승인 요청하기
[취소 버튼] 이전 페이지로 돌아가기`,
  },
];
