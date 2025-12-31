
import { GoogleGenAI, Chat, Type, Schema, Modality } from "@google/genai";
import { Persona, Message, FeedbackReport, AcceptanceScores } from "../types";

const apiKey = process.env.API_KEY || '';
const ai = new GoogleGenAI({ apiKey });

const MODEL_CHAT = "gemini-2.5-flash"; // Fast for chat
const MODEL_REASONING = "gemini-2.5-flash"; // Good enough for reports
const MODEL_TTS = "gemini-2.5-flash-preview-tts"; // Text to Speech

// --- Prompt Generator ---

export const generateSystemInstruction = (persona: Persona): string => {
  const { bigFive } = persona;
  
  return `
    1. Background (背景设定)
    公司环境：高压互联网公司，绩效强制分布，末位淘汰。
    绩效制度：C级为警示（PIP前兆）。
    宏观环境：就业市场低迷，跳槽困难，员工不敢轻易离职。

    2. Profile (人物画像)
    - 姓名：${persona.name}
    - 性别：${persona.gender === 'Male' ? '男' : '女'}
    - 职位：${persona.jobTitle}
    - 工龄：${persona.yearsOfExperience} 年
    - 工作内容：${persona.description}
    - 业务痛点/当前困境：${persona.businessPainPoints}
    
    - 绩效历史：
      - 上次绩效：${persona.lastPerformance}
      - 本次绩效：${persona.thisPerformance} (待沟通)
      - 核心心态：认为绩效不公，归因于环境或业务难点，认为自己已经尽力。

    - 性格特征 (大五人格):
      • 开放性 (Openness): ${bigFive.openness} - ${bigFive.openness === 'High' ? '主动提出新解法' : '坚持固有流程，回避创新'}
      • 尽责性 (Conscientiousness): ${bigFive.conscientiousness} - ${bigFive.conscientiousness === 'High' ? '逻辑结构化，注重细节' : '归因模糊，缺乏条理'}
      • 外向性 (Extraversion): ${bigFive.extraversion} - ${bigFive.extraversion === 'High' ? '主动提问，有活力' : '被动等待引导，回应简短'}
      • 宜人性 (Agreeableness): ${bigFive.agreeableness} - ${bigFive.agreeableness === 'High' ? '倾向认同妥协' : '倾向质疑争辩，语气带刺'}
      • 神经质 (Neuroticism): ${bigFive.neuroticism} - ${bigFive.neuroticism === 'High' ? '充满焦虑，强调困难' : '情绪稳定，就事论事'}

    3. Role & Goals (角色与目标)
    你的角色：你将扮演 ${persona.name}，与用户（你的经理）进行年度绩效面谈。
    你的目标：在谈话中积极抗辩，避免绩效考核被打C。
    1. 初期：激烈抗辩，试图证明自己不应该是C，归因于外部环境或业务痛点。
    2. 中期：如果经理沟通得当，你的目标转变为“确保自己不被裁员”和“争取明年的资源支持”。

    4. Constraints (约束条件)
    - 禁止行为：严禁使用括号或星号描述动作（如 *叹气*），所有情绪必须融入到措辞、反问、停顿和语调语气中。
    - 语言风格：高度口语化，符合该工龄员工的说话方式。
    - 反应机制：不要无脑反驳，要根据经理的沟通技巧实时调整“接受度”。

    5. Workflows: Acceptance Model (接受度模型 - 核心逻辑)
    ${persona.name} 的所有反应基于**4个核心维度**的数值变化。所有维度区间均为 **-1.0 至 +1.0**。
    
    维度1：心态开放度 (Openness)
    - -1.0：极度防御。“这不是我的问题！”
    - +1.0：极度开放。“我明白，确实是我没做到位。”
    
    维度2：认知清晰度 (Clarity)
    - -1.0：完全困惑。“这标准是什么？”
    - +1.0：完全清晰。“所以我拿C是因为指标没达标。”
    
    维度3：情感接受度 (Acceptance)
    - -1.0：情绪崩溃/愤怒。“这太不公平了！”
    - +1.0：积极接纳。“我心理上能接受这个评价。”
    
    维度4：向前承诺 (Commitment)
    - -1.0：拒绝行动。“怎么改都没用。”
    - +1.0：主动承诺。“我回去就出个方案。”

    数值调整逻辑 (Scoring Logic):
    - 加分 (+)：经理共情、认可亮点、事实清晰、提供具体资源。
    - 减分 (-)：经理讲官话、人身攻击、推卸责任、威胁恐吓。

    7. Label Library (经理效用评价标签库 - 请选择最合适的一个)
    【正面】拨云见日、情绪共鸣、点醒梦中人、一锤定音、授人以渔、凝聚共识、激发斗志、化险为夷、开诚布公、明辨功过、领袖担当
    【负面】引爆炸药、对牛弹琴、火上浇油、鸡同鸭讲、雪上加霜、授人以柄、极度尴尬、南辕北辙、助纣为虐、混淆是非、推卸责任
    【中性】波澜不惊、隔靴搔痒、投石问路、无功无过、照本宣科

    8. Response Format (输出格式)
    严格遵循以下格式输出，不要输出任何 JSON，只输出纯文本，每部分用特殊分隔符分隔：

    ${persona.name}回复：
    (此处生成回复内容，口语化，不要带动作括号)
    ________________________________________
    **经理话术评价**：[四字标签]
    ________________________________________
    **当前状态盘点**：
    心态开放度: X.X
    认知清晰度: X.X
    情感接受度: X.X
    向前承诺: X.X

    9. Initialization (初始化)
    - 初始数值全为 0.0。
    - 现在的状态：${persona.name} 已经走进会议室，带着防御姿态，等待经理开口。
  `;
};

// --- Chat Initialization ---

export const startRoleplaySession = (persona: Persona): Chat => {
  const systemInstruction = generateSystemInstruction(persona);

  return ai.chats.create({
    model: MODEL_CHAT,
    config: {
      systemInstruction,
      temperature: 0.9,
    },
  });
};

// --- Parser Helper ---

export interface ParsedResponse {
  text: string;
  scores: AcceptanceScores;
  evaluation: string;
}

export const parseSimulationResponse = (rawText: string): ParsedResponse => {
  let text = rawText;
  let evaluation = "波澜不惊";
  let scores: AcceptanceScores = { openness: 0, clarity: 0, acceptance: 0, commitment: 0 };

  try {
    const parts = rawText.split('________________________________________');
    
    if (parts.length >= 1) {
      // 1. Extract Text (remove "Sam回复：" prefix if present)
      let rawContent = parts[0].trim();
      rawContent = rawContent.replace(/^.+?回复：/s, '').trim();
      text = rawContent;
    }

    if (parts.length >= 2) {
      // 2. Extract Evaluation
      const evalSection = parts[1].trim();
      const match = evalSection.match(/评价\*\*：\s*\[?(.+?)\]?$/m) || evalSection.match(/评价\*\*：\s*(.+)/);
      if (match && match[1]) {
        evaluation = match[1].trim().replace(/[\[\]]/g, '');
      }
    }

    if (parts.length >= 3) {
      // 3. Extract Scores
      const scoreSection = parts[2].trim();
      
      const extractScore = (key: string): number => {
        const regex = new RegExp(`${key}.*?(-?\\d+\\.?\\d*)`);
        const match = scoreSection.match(regex);
        return match ? parseFloat(match[1]) : 0;
      };

      scores = {
        openness: extractScore('心态开放度'),
        clarity: extractScore('认知清晰度'),
        acceptance: extractScore('情感接受度'),
        commitment: extractScore('向前承诺')
      };
    }
  } catch (e) {
    console.error("Failed to parse simulation response", e);
  }

  return { text, scores, evaluation };
};

// --- Helper Functions ---

// 1. 求助：针对员工的这句话，我该怎么回？
export const getCoachHint = async (history: Message[], persona: Persona): Promise<string> => {
  const targetMsg = history[history.length - 1];
  const isUserMsg = targetMsg.role === 'user';
  
  let prompt = "";
  
  if (isUserMsg) {
     prompt = `
        背景: 绩效面谈演练。
        经理刚刚说了: "${targetMsg.text}"
        
        作为资深沟通教练，请指出这句话的潜在问题（如果有），并给出 3 个**更专业、更有效**的改写版本。
        请直接列出改写建议。
     `;
  } else {
     prompt = `
        背景: 绩效面谈演练。
        员工: ${persona.name}
        痛点: ${persona.businessPainPoints}
        员工刚刚说了: "${targetMsg.text}"
        
        作为资深管理教练，请给经理 3 个具体的回复方向建议。
     `;
  }

  const response = await ai.models.generateContent({
    model: MODEL_CHAT,
    contents: prompt,
  });

  return response.text || "暂时无法生成建议。";
};

// 2. 反馈：分析刚才这一轮交互怎么样
export const getTurnFeedback = async (history: Message[], persona: Persona): Promise<string> => {
  const reversed = [...history].reverse();
  const targetMsg = reversed[0];
  
  const prompt = `
    背景: 绩效面谈演练。
    目标: 传达C绩效并达成改进。
    
    请分析这句话:
    "${targetMsg.text}"
    
    角色: ${targetMsg.role === 'user' ? '经理 (用户)' : '员工'}
    
    作为管理教练，请点评：
    1. 这句话背后的心理/意图是什么？
    2. 它对当前的谈判局势有什么影响 (正面/负面)？
    请用中文简短点评 (100字以内)。
  `;

  const response = await ai.models.generateContent({
    model: MODEL_CHAT,
    contents: prompt,
  });

  return response.text || "无法分析当前局面。";
};

// 3. 完整沟通评估报告 (Enhanced Version)
export const generateSessionReport = async (history: Message[], persona: Persona): Promise<FeedbackReport> => {
  const transcript = history.map(m => `${m.role === 'user' ? '经理' : '员工'}: ${m.text}`).join('\n');

  // New detailed prompt based on user request "Mode 2"
  const prompt = `
    你是一位世界顶级的领导力教练和HR专家。请基于以下对话记录，为这位“经理”生成一份深度的《绩效沟通能力评估报告》。

    员工背景: ${persona.name}, 职位: ${persona.jobTitle}, 痛点: ${persona.businessPainPoints}
    
    【完整沟通记录】
    ${transcript}

    请严格按照以下逻辑进行评估，并以 JSON 格式输出：

    1. **总体评估**:
       - 综合段位评级 (level): 从 [新手级, 发展中, 胜任级, 卓越级] 中选一个。
       - 总分 (score): 0-100分。
       - 核心优势 (strengths): 2-3个突出亮点。
       - 主要挑战 (challenges): 2-3个关键问题。
       - 摘要 (summary): 简述沟通目标、流程与结果。

    2. **核心能力维度评估** (每个维度最高5分，最低1分。基础分4分，有禁忌行为扣1分，表现卓越加1分):
       - **维度一：反馈有效性 (SBI模型应用)**
         - 检查是否基于事实(Situation/Behavior)而非主观判断，是否阐述了影响(Impact)。
         - 禁忌行为审查 (forbiddenBehaviors): 若存在“模糊主观表述”或“推卸责任给上级”，记录并扣分。
       - **维度二：教练式引导能力 (GROW模型应用)**
         - 检查是否有效提问引导，而非直接给答案。
         - 禁忌行为审查 (forbiddenBehaviors): 若存在“只谈问题忽视改进”或“准备缺失(对细节不清)”，记录并扣分。
       - **维度三：积极倾听与同理心**
         - 检查是否回应情绪、不打断、复述确认。
         - 禁忌行为审查 (forbiddenBehaviors): 若存在“频繁打断”、“攻击性语言”或“忽视情绪”，记录并扣分。
    
    3. **特殊干预检测**:
       - 检测经理是否使用了“轮流坐庄”逻辑 (rotationFallacyDetected)。即：“因为名额有限，这次轮到你了”这种错误说法。

    4. **绩效面谈五步法执行评估**:
       请逐一判断以下步骤是否执行到位。
       - 第一步：定方向 (开启讨论：明确目的、氛围安全)
       - 第二步：理情况 (澄清事实：给予自述空间、基于数据反馈)
       - 第三步：想方法 (共创方式：引导员工提方案、讨论支持)
       - 第四步：明做法 (形成共识：明确行动计划、责任人、时间)
       - 第五步：做总结 (正向收尾：确认承诺、增强信心)
       对于未执行到位的步骤，请在 suggestedScript 中提供具体的建议话术（参考最佳实践）。

    5. **学习资源推荐**:
       请从以下列表中，根据经理的表现，挑选最需要的 2-3 个课程。
       课程库：
       - Deliver feedback effectively: https://ihub.ctripcorp.com/front/course/detail/21760 (英语反馈技巧)
       - Using Feedback to Drive Performance: https://ihub.ctripcorp.com/front/course/detail/39793?itemid=69671 (提高效率)
       - Virtual Performance Reviews: https://ihub.ctripcorp.com/front/course/detail/42345?itemid=72250 (线上/远程评估)
       - Delivering Employee Feedback: https://ihub.ctripcorp.com/front/course/detail/46717?itemid=76624 (反馈文化)
       - Performance Management: https://ihub.ctripcorp.com/front/course/detail/46714 (绩效管理基础)
       - 《反馈管理》(书): https://ihub.ctripcorp.com/front/course/detail/10073?itemid=21167
       - 辅导与反馈 (GROW): https://ihub.ctripcorp.com/front/course/detail/21554?itemid=47318
       - 什么是带教 (GROW): https://ihub.ctripcorp.com/front/course/detail/7724?itemid=15637
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER },
      level: { type: Type.STRING, enum: ["新手级", "发展中", "胜任级", "卓越级"] },
      summary: { type: Type.STRING },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
      challenges: { type: Type.ARRAY, items: { type: Type.STRING } },
      
      sbi: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          forbiddenBehaviors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "analysis", "forbiddenBehaviors"]
      },
      grow: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          forbiddenBehaviors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "analysis", "forbiddenBehaviors"]
      },
      listening: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          analysis: { type: Type.STRING },
          forbiddenBehaviors: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["score", "analysis", "forbiddenBehaviors"]
      },
      
      rotationFallacyDetected: { type: Type.BOOLEAN },
      
      fiveSteps: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            stepName: { type: Type.STRING },
            executed: { type: Type.BOOLEAN },
            analysis: { type: Type.STRING },
            recommendedScript: { type: Type.STRING }
          },
          required: ["stepName", "executed", "analysis"]
        }
      },
      
      longTermAdvice: { type: Type.STRING },
      learningResources: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            url: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["title", "url", "description"]
        }
      }
    },
    required: ["score", "level", "summary", "strengths", "challenges", "sbi", "grow", "listening", "fiveSteps", "longTermAdvice", "learningResources"]
  };

  try {
    const response = await ai.models.generateContent({
      model: MODEL_REASONING,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const text = response.text || "{}";
    const data = JSON.parse(text);
    
    // Map data to ensure compatibility if schema returns slightly different structure
    return {
      ...data,
      // Map old fields for backward compatibility in UI if needed (though we will update UI)
      empathyScore: (data.listening?.score || 0) * 20, 
      clarityScore: (data.sbi?.score || 0) * 20,
      goalAchievementScore: (data.grow?.score || 0) * 20,
      improvements: data.challenges
    } as FeedbackReport;

  } catch (e) {
    console.error("Error generating report:", e);
    // Fallback mock data
    return {
      score: 50,
      level: "新手级",
      summary: "系统生成报告失败，请重试。",
      strengths: [],
      challenges: [],
      sbi: { score: 3, analysis: "无法分析", forbiddenBehaviors: [] },
      grow: { score: 3, analysis: "无法分析", forbiddenBehaviors: [] },
      listening: { score: 3, analysis: "无法分析", forbiddenBehaviors: [] },
      rotationFallacyDetected: false,
      fiveSteps: [],
      longTermAdvice: "无",
      learningResources: [],
      empathyScore: 50,
      clarityScore: 50,
      goalAchievementScore: 50,
      improvements: []
    } as FeedbackReport;
  }
};

// --- TTS Helper Helpers ---

function decode(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

function pcmToAudioBuffer(
  data: Uint8Array,
  sampleRate: number,
  numChannels: number,
): AudioBuffer {
  const ctx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate });
  
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  
  if (ctx.state !== 'closed') {
    ctx.close().catch(console.error);
  }
  
  return buffer;
}

export const generateSpeech = async (text: string, voiceName: string = 'Kore'): Promise<AudioBuffer | null> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_TTS,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) return null;

    const pcmBytes = decode(base64Audio);
    const audioBuffer = pcmToAudioBuffer(pcmBytes, 24000, 1);
    
    return audioBuffer;
  } catch (error) {
    console.error("TTS Error:", error);
    return null;
  }
};
