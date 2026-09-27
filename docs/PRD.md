# Lucid — Product Requirements (v1)

> Generated with an AI chat assistant in Mission 1, then edited by a human.
> An AI-written PRD is a draft. Cut anything you can't build in the time you have.

## Problem
Search engines return ten blue links; chatbots return confident answers with no proof.
Students want a direct answer **and** the sources to verify it.

## Users
- Students researching a topic for assignments or interviews
- Developers looking up docs, errors and comparisons

## Core user stories (v1 — must ship today)
1. As a user, I type a question and press Enter.
2. I see the web sources the answer is based on (title, site, link).
3. The answer streams in word by word, with numbered citations like [1] that link to those sources.
4. I get 3 related follow-up questions and can click one to continue.
5. The app works on mobile and in dark mode.

## Nice to have (v2 — take-home)
- Search history saved to a database (Supabase) and a sidebar to reopen past answers
- "Focus" modes: Web, News, Academic, YouTube
- Upload a PDF and ask questions about it (classic vector RAG)
- Login (GitHub OAuth), per-user rate limiting
- Share an answer via a public link

## Out of scope
Payments, admin panel, mobile apps, fine-tuning models.

## Non-functional requirements
- First source visible in < 3 s, first answer token in < 5 s on college Wi-Fi
- API keys never reach the browser
- Runs on free tiers only: Vercel Hobby, Groq/Gemini free, Tavily free
- Graceful errors: rate limit, missing key, no results

## Success metric for the workshop
A public Vercel URL that answers a question with working citations.
