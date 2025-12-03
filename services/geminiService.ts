
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
  // Find the message we clicked on (which is usually the last one in the sliced history passed in)
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

export const generateSessionReport = async (history: Message[], persona: Persona): Promise<FeedbackReport> => {
  const transcript = history.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');

  const prompt = `
    扮演一位资深人力资源总监和领导力教练。分析以下绩效评估对话记录。
    
    员工: ${persona.name} (${persona.jobTitle})
    工龄: ${persona.yearsOfExperience}年
    痛点: ${persona.businessPainPoints}

    对话记录:
    ${transcript}

    请以 JSON 格式提供结构化的评估，**所有文本内容必须使用中文**。
  `;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      score: { type: Type.NUMBER, description: "总体效果评分 (0-100)" },
      empathyScore: { type: Type.NUMBER, description: "同理心评分 (0-100)" },
      clarityScore: { type: Type.NUMBER, description: "沟通清晰度评分 (0-100)" },
      goalAchievementScore: { type: Type.NUMBER, description: "是否达成了下一步共识? (0-100)" },
      summary: { type: Type.STRING, description: "对话的简要执行摘要 (中文)。" },
      strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: "经理做通过的3个优点 (中文)。" },
      improvements: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3个需要改进的地方 (中文)。" },
      transcriptReview: { type: Type.STRING, description: "一段话突出对话中的关键转折点 (中文)。" }
    },
    required: ["score", "empathyScore", "clarityScore", "goalAchievementScore", "summary", "strengths", "improvements", "transcriptReview"]
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
    return JSON.parse(text) as FeedbackReport;
  } catch (e) {
    console.error("Error generating report:", e);
    // Fallback mock data
    return {
      score: 50,
      empathyScore: 50,
      clarityScore: 50,
      goalAchievementScore: 50,
      summary: "无法生成详细报告。请人工查看对话记录。",
      strengths: ["尝试进行了对话"],
      improvements: ["系统分析错误"],
      transcriptReview: "无"
    };
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
