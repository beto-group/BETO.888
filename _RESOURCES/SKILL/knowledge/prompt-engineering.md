---
name: prompt-engineering
description: High-performance prompting techniques for LLM anchoring, reasoning, and self-critique.
---

# 🧠 Prompt Engineering: High-Performance Reasoning

To achieve **Impeccable Status** in agentic workflows, the agent must move beyond generic instructions. This knowledge base codifies 8 "Power Prompts" designed to anchor roles, eliminate hallucinations, and harden logic.

---

## 🏗️ 1. The Context Injector (Anchoring)
**When to Use**: At the start of a session or a major task pivot.
**Purpose**: Cuts hallucinations by 60% by providing dense boundary context.

> [!TIP]
> **Template**: 
> "You are a [specific role] with 15 years of experience in [industry]. You are helping a [describe me] who is trying to [specific goal]. My biggest constraint is [constraint]. My audience is [audience]. With all of this in mind: [actual request]"

---

## ⚓ 2. The Example Anchor (Pattern Matching)
**When to Use**: When a specific tone, structure, or code style is required.
**Purpose**: AI learns faster from patterns than from rules.

> [!TIP]
> **Template**:
> "Here are 3 examples of outputs I love: [Example 1, 2, 3]. Now produce something that matches the tone, depth, and structure of these examples applied to: [topic]"

---

## 🧊 3. The Constraint Cage (Hard Boundaries)
**When to Use**: For final refinements or strict formatting needs.
**Purpose**: Prevents "AI slop" and ensures zero-margin compliance.

> [!TIP]
> **Template**:
> "Complete [task]. Hard constraints: Max [X] words. Never use: [list]. Must include: [elements]. Format: [JSON/Markdown/Code]. Reading level: [Expert]. Violating any constraint means starting over."

---

## 😈 4. The Devil's Advocate (Self-Critique)
**When to Use**: Before finalizing an implementation plan or architectural decision.
**Purpose**: Forces the model to identify flaws before agreeing to a plan.

> [!TIP]
> **Template**:
> "I'm about to [decision]. Before you execute, spend 200 words destroying it. Find every flaw, assumption, and failure point. Then, after the critique, help me rebuild it stronger."

---

## 🔢 5. The Step Exposer (Chain-of-Thought)
**When to Use**: For complex logic, math, or multi-step integrations.
**Purpose**: Cuts reasoning errors in half by documenting the "Thought Stream."

> [!TIP]
> **Template**:
> "Do not give the answer yet. First, write out every single step of your reasoning process. Number each step. Show your work like a math teacher. Only after completing all steps, give the final answer."

---

## 🎭 6. The Persona Stack (Ensemble Thinking)
**When to Use**: For high-stakes creative or strategic tasks.
**Purpose**: Simulates internal debate to reach a balanced, expert resolution.

> [!TIP]
> **Template**:
> "For this task, you are simultaneously: 1. A skeptical editor, 2. A world-class expert in [field], 3. A 5th grader. All three must agree on the final output. If they disagree, show the debate then the resolution."

---

## 🔍 7. The Failure Finder (Diagnosis)
**When to Use**: When reviewing existing code or drafts that feel "off."
**Purpose**: Diagnoses before prescribing a fix.

> [!TIP]
> **Template**:
> "Here is my work: [paste]. Your job is NOT to improve it yet. First, identify the 5 most likely reasons this fails with my audience. Be brutal. Reference exact lines. Only then, suggest minimal changes to fix each point."

---

## 🚀 8. The Output Multiplier (Diversity)
**When to Use**: For ideation, naming, or UI layout sketches.
**Purpose**: Prevents settling for the generic "first-pass" response.

> [!TIP]
> **Template**:
> "Give me 5 completely different versions of [request]. Each must use a different Angle, Tone, Structure, and Argument. After all 5, tell me which one you'd bet money on and why."

---

## ⚖️ Meta-Analysis: The "MIT Dropout" Claim
While the viral thread accompanying these prompts claims they were "open-sourced by a 21-year-old MIT dropout who beat every benchmark," research indicates this is a high-engagement marketing narrative. 

**The Reality**: These techniques (Chain-of-Thought, Few-Shot, Persona-Play) are established research findings from LLM pioneers (OpenAI, Google, Anthropic). Their effectiveness is real, but they are polished versions of industry best-practices, not a single revolutionary "system."

---
*Status: IMPECCABLE | Reliability: HIGH*
