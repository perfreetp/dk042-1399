import type { ReviewTask, RejectTemplate, ReviewStats, UserPreferences } from '../types'

export const mockTasks: ReviewTask[] = [
  {
    id: 'T202401150001',
    patientId: 'P0012345',
    patientName: '张建国',
    age: 65,
    gender: '男',
    examType: 'CT',
    examBodyPart: '胸部',
    accessionNumber: 'ACC20240115001',
    examNumber: 'CT2401150001',
    isEmergency: false,
    studyDate: '2024-01-15 08:30:00',
    urgency: 'urgent',
    aiAnalyzedAt: '2024-01-15 08:35:22',
    waitingMinutes: 28,
    previousExamId: 'T202312200045',
    previousExamDate: '2023-12-20',
    status: 'pending',
    aiSummary: '右肺上叶见结节影，较前增大，建议增强扫描。右肺中叶少许条索影，考虑陈旧性病变。',
    aiConfidence: 0.92,
    hasAbnormal: true,
    lesions: [
      {
        id: 'L1',
        name: '右肺上叶结节',
        type: '结节',
        size: 10.5,
        previousValue: 8.2,
        currentValue: 10.5,
        unit: 'mm',
        changePercent: 28.0,
        isSignificant: true,
        location: '右肺上叶尖段 (S1)'
      },
      {
        id: 'L2',
        name: '右肺中叶条索影',
        type: '条索',
        size: 15.0,
        currentValue: 15.0,
        unit: 'mm',
        isSignificant: false,
        location: '右肺中叶外侧段 (S4)'
      }
    ],
    suggestions: [
      {
        id: 'S1',
        type: 'finding',
        content: '右肺上叶尖段见一结节影，大小约10.5mm×8.8mm，边界欠清，可见分叶征及毛刺征，较前次检查（2023-12-20）结节8.2mm明显增大，增大率约28%。',
        aiConfidence: 0.94,
        accepted: null,
        isModified: false
      },
      {
        id: 'S2',
        type: 'finding',
        content: '右肺中叶外侧段见少许条索影，边界清，考虑陈旧性纤维灶，较前无明显变化。',
        aiConfidence: 0.88,
        accepted: null,
        isModified: false
      },
      {
        id: 'S3',
        type: 'impression',
        content: '1. 右肺上叶结节影，较前增大，恶性待排，建议增强CT扫描或PET-CT进一步检查。\n2. 右肺中叶陈旧性病变，随访。',
        aiConfidence: 0.85,
        accepted: null,
        isModified: false
      }
    ],
    modifications: [],
    originalImageUrl: '',
    aiAnnotatedImageUrl: ''
  },
  {
    id: 'T202401150002',
    patientId: 'P0067890',
    patientName: '李秀英',
    age: 54,
    gender: '女',
    examType: 'MRI',
    examBodyPart: '头颅',
    accessionNumber: 'ACC20240115002',
    examNumber: 'MR2401150002',
    isEmergency: true,
    studyDate: '2024-01-15 08:45:00',
    urgency: 'emergency',
    aiAnalyzedAt: '2024-01-15 08:50:15',
    waitingMinutes: 15,
    status: 'pending',
    aiSummary: '左侧基底节区见新发脑梗死灶，DWI高信号，建议神经内科急会诊。',
    aiConfidence: 0.97,
    hasAbnormal: true,
    lesions: [
      {
        id: 'L3',
        name: '左侧基底节区梗死灶',
        type: '梗塞',
        size: 18.0,
        currentValue: 18.0,
        unit: 'mm',
        isSignificant: true,
        location: '左侧基底节区'
      }
    ],
    suggestions: [
      {
        id: 'S4',
        type: 'finding',
        content: '左侧基底节区见片状异常信号影，T1WI呈稍低信号，T2WI及FLAIR呈稍高信号，DWI呈明显高信号，ADC呈低信号，范围约18mm×14mm，考虑急性脑梗死。脑室系统未见扩张，中线结构居中。',
        aiConfidence: 0.97,
        accepted: null,
        isModified: false
      },
      {
        id: 'S5',
        type: 'impression',
        content: '左侧基底节区急性脑梗死，建议神经内科紧急会诊。',
        aiConfidence: 0.96,
        accepted: null,
        isModified: false
      }
    ],
    modifications: [],
    originalImageUrl: '',
    aiAnnotatedImageUrl: ''
  },
  {
    id: 'T202401150003',
    patientId: 'P0023456',
    patientName: '王大力',
    age: 45,
    gender: '男',
    examType: 'DR',
    examBodyPart: '胸部',
    accessionNumber: 'ACC20240115003',
    examNumber: 'DR2401150003',
    isEmergency: false,
    studyDate: '2024-01-15 09:00:00',
    urgency: 'routine',
    aiAnalyzedAt: '2024-01-15 09:02:30',
    waitingMinutes: 58,
    previousExamId: 'T202311050012',
    previousExamDate: '2023-11-05',
    status: 'pending',
    aiSummary: '双肺纹理清晰，未见明显实质性病变。心影大小形态正常。',
    aiConfidence: 0.95,
    hasAbnormal: false,
    lesions: [],
    suggestions: [
      {
        id: 'S6',
        type: 'finding',
        content: '双肺纹理清晰，未见明显实质性病变或结节影。肺门结构正常，纵隔居中。心影大小形态在正常范围内。双侧膈面光滑，双侧肋膈角锐利。胸廓骨骼未见明显异常。',
        aiConfidence: 0.95,
        accepted: null,
        isModified: false
      },
      {
        id: 'S7',
        type: 'impression',
        content: '胸部DR平片未见明显异常。',
        aiConfidence: 0.98,
        accepted: null,
        isModified: false
      }
    ],
    modifications: [],
    originalImageUrl: '',
    aiAnnotatedImageUrl: ''
  },
  {
    id: 'T202401150004',
    patientId: 'P0089012',
    patientName: '陈美玲',
    age: 58,
    gender: '女',
    examType: 'CT',
    examBodyPart: '腹部',
    accessionNumber: 'ACC20240115004',
    examNumber: 'CT2401150004',
    isEmergency: false,
    studyDate: '2024-01-15 09:15:00',
    urgency: 'routine',
    aiAnalyzedAt: '2024-01-15 09:20:45',
    waitingMinutes: 43,
    status: 'pending',
    aiSummary: '肝右叶见囊肿，大小约22mm，较前无明显变化。胆囊结石。',
    aiConfidence: 0.91,
    hasAbnormal: true,
    lesions: [
      {
        id: 'L4',
        name: '肝右叶囊肿',
        type: '囊肿',
        size: 22.0,
        previousValue: 21.5,
        currentValue: 22.0,
        unit: 'mm',
        changePercent: 2.3,
        isSignificant: false,
        location: '肝右叶S6段'
      },
      {
        id: 'L5',
        name: '胆囊结石',
        type: '结石',
        size: 8.0,
        currentValue: 8.0,
        unit: 'mm',
        isSignificant: false,
        location: '胆囊腔内'
      }
    ],
    suggestions: [
      {
        id: 'S8',
        type: 'finding',
        content: '肝右叶S6段见一类圆形低密度灶，大小约22mm×20mm，边界清，增强扫描未见强化，考虑囊肿，较前（2023-09-10）21.5mm无明显变化。胆囊腔内见结节状高密度影，最大约8mm，考虑胆囊结石。',
        aiConfidence: 0.91,
        accepted: null,
        isModified: false
      },
      {
        id: 'S9',
        type: 'impression',
        content: '1. 肝右叶囊肿，随访。\n2. 胆囊结石，建议结合临床。',
        aiConfidence: 0.89,
        accepted: null,
        isModified: false
      }
    ],
    modifications: [],
    originalImageUrl: '',
    aiAnnotatedImageUrl: ''
  },
  {
    id: 'T202401150005',
    patientId: 'P0034567',
    patientName: '赵志强',
    age: 72,
    gender: '男',
    examType: 'CT',
    examBodyPart: '胸部',
    accessionNumber: 'ACC20240115005',
    examNumber: 'CT2401150005',
    isEmergency: false,
    studyDate: '2024-01-15 09:30:00',
    urgency: 'urgent',
    aiAnalyzedAt: '2024-01-15 09:35:10',
    waitingMinutes: 75,
    previousExamId: 'T202310150088',
    previousExamDate: '2023-10-15',
    status: 'pending',
    aiSummary: '左肺下叶见磨玻璃结节，较前略有增大。双肺气肿改变。',
    aiConfidence: 0.89,
    hasAbnormal: true,
    lesions: [
      {
        id: 'L6',
        name: '左肺下叶磨玻璃结节',
        type: '磨玻璃结节',
        size: 11.2,
        previousValue: 9.5,
        currentValue: 11.2,
        unit: 'mm',
        changePercent: 17.9,
        isSignificant: true,
        location: '左肺下叶后基底段 (S10)'
      }
    ],
    suggestions: [
      {
        id: 'S10',
        type: 'finding',
        content: '左肺下叶后基底段见磨玻璃结节影，大小约11.2mm×9.5mm，密度不均，内见空泡征，较前次检查（2023-10-15）结节9.5mm有所增大。双肺野透亮度增高，肺纹理稀疏，呈肺气肿改变。',
        aiConfidence: 0.89,
        accepted: null,
        isModified: false
      },
      {
        id: 'S11',
        type: 'impression',
        content: '1. 左肺下叶磨玻璃结节，较前增大，建议密切随访或进一步检查。\n2. 双肺气肿。',
        aiConfidence: 0.85,
        accepted: null,
        isModified: false
      }
    ],
    modifications: [],
    originalImageUrl: '',
    aiAnnotatedImageUrl: ''
  },
  {
    id: 'T202401150006',
    patientId: 'P0045678',
    patientName: '孙丽华',
    age: 38,
    gender: '女',
    examType: 'US',
    examBodyPart: '甲状腺',
    accessionNumber: 'ACC20240115006',
    examNumber: 'US2401150006',
    isEmergency: false,
    studyDate: '2024-01-15 09:45:00',
    urgency: 'routine',
    aiAnalyzedAt: '2024-01-15 09:48:20',
    waitingMinutes: 35,
    status: 'pending',
    aiSummary: '甲状腺右叶结节，TI-RADS 3类，建议随访。',
    aiConfidence: 0.86,
    hasAbnormal: true,
    lesions: [
      {
        id: 'L7',
        name: '甲状腺右叶结节',
        type: '结节',
        size: 12.0,
        currentValue: 12.0,
        unit: 'mm',
        isSignificant: false,
        location: '甲状腺右叶中下部'
      }
    ],
    suggestions: [
      {
        id: 'S12',
        type: 'finding',
        content: '甲状腺大小形态正常，包膜光滑。右叶中下部见一低回声结节，大小约12mm×10mm×8mm，边界清，形态规则，内回声尚均匀，未见明显钙化灶，CDFI：结节内未见明显异常血流信号。左叶未见明显异常。',
        aiConfidence: 0.86,
        accepted: null,
        isModified: false
      },
      {
        id: 'S13',
        type: 'impression',
        content: '甲状腺右叶结节，TI-RADS 3类，建议6-12个月随访。',
        aiConfidence: 0.84,
        accepted: null,
        isModified: false
      }
    ],
    modifications: [],
    originalImageUrl: '',
    aiAnnotatedImageUrl: ''
  },
  {
    id: 'T202401150007',
    patientId: 'P0056789',
    patientName: '周明辉',
    age: 61,
    gender: '男',
    examType: 'CT',
    examBodyPart: '胸部',
    accessionNumber: 'ACC20240115007',
    examNumber: 'CT2401150007',
    isEmergency: false,
    studyDate: '2024-01-15 10:00:00',
    urgency: 'routine',
    aiAnalyzedAt: '2024-01-15 10:03:45',
    waitingMinutes: 95,
    status: 'pending',
    aiSummary: '双肺未见明显异常。主动脉及冠状动脉钙化。',
    aiConfidence: 0.93,
    hasAbnormal: false,
    lesions: [],
    suggestions: [
      {
        id: 'S14',
        type: 'finding',
        content: '双肺纹理清晰，未见明显实质性病变。气管及主支气管通畅。纵隔居中，主动脉壁及冠状动脉走行区见斑点状钙化灶。心脏大小形态正常。胸膜未见明显增厚。',
        aiConfidence: 0.93,
        accepted: null,
        isModified: false
      },
      {
        id: 'S15',
        type: 'impression',
        content: '1. 胸部CT平扫未见明显异常。\n2. 主动脉及冠状动脉钙化。',
        aiConfidence: 0.91,
        accepted: null,
        isModified: false
      }
    ],
    modifications: [],
    originalImageUrl: '',
    aiAnnotatedImageUrl: ''
  }
]

export const mockRejectTemplates: RejectTemplate[] = [
  { id: 'RT001', category: '影像质量', content: '影像质量欠佳，存在运动伪影，建议重新扫描。', usageCount: 45 },
  { id: 'RT002', category: '影像质量', content: '扫描层面不完整，病灶区域未完全覆盖，需补充扫描。', usageCount: 23 },
  { id: 'RT003', category: '影像质量', content: '增强扫描时相选择不当，影响诊断，建议重新增强扫描。', usageCount: 18 },
  { id: 'RT004', category: 'AI标注', content: 'AI标注存在明显错误，将正常血管误判为病灶，需重新分析。', usageCount: 37 },
  { id: 'RT005', category: 'AI标注', content: 'AI漏诊明显病灶，检测灵敏度不足，需人工重新阅片。', usageCount: 29 },
  { id: 'RT006', category: 'AI标注', content: '病灶测量值不准确，与实际大小存在明显偏差。', usageCount: 15 },
  { id: 'RT007', category: '报告内容', content: '报告描述不完整，缺少关键影像学特征描述。', usageCount: 31 },
  { id: 'RT008', category: '报告内容', content: '诊断意见不够明确，需补充鉴别诊断内容。', usageCount: 27 },
  { id: 'RT009', category: '患者信息', content: '患者基本信息与检查申请单不符，请核对后再提交。', usageCount: 12 },
  { id: 'RT010', category: '其他', content: '需要结合病史及其他检查结果综合判断，请提供完整临床资料。', usageCount: 20 }
]

export const mockStats: ReviewStats = {
  todayReviewed: 28,
  todayApproved: 23,
  todayRejected: 5,
  avgReviewMinutes: 4.2,
  weeklyData: [
    { date: '01-09', count: 32, avgTime: 4.8 },
    { date: '01-10', count: 28, avgTime: 4.5 },
    { date: '01-11', count: 35, avgTime: 4.2 },
    { date: '01-12', count: 30, avgTime: 4.6 },
    { date: '01-13', count: 25, avgTime: 4.0 },
    { date: '01-14', count: 8, avgTime: 5.1 },
    { date: '01-15', count: 28, avgTime: 4.2 }
  ],
  byExamType: [
    { type: 'CT', count: 78, approvalRate: 0.82 },
    { type: 'MRI', count: 35, approvalRate: 0.77 },
    { type: 'DR', count: 52, approvalRate: 0.91 },
    { type: 'US', count: 28, approvalRate: 0.86 },
    { type: 'PET-CT', count: 8, approvalRate: 0.75 }
  ]
}

export const mockPreferences: UserPreferences = {
  defaultView: 'split',
  autoAdvance: true,
  showChangeHighlight: true,
  showConfidence: true,
  keyboardShortcuts: {
    approve: 'Ctrl+Enter',
    reject: 'Ctrl+R',
    next: 'Ctrl+→',
    previous: 'Ctrl+←',
    toggleAccept: 'Space',
    zoomIn: 'Ctrl++',
    zoomOut: 'Ctrl+-'
  },
  commonRejectReasons: ['影像质量欠佳', 'AI标注存在明显错误', '报告描述不完整'],
  reviewReminderMinutes: 30
}
