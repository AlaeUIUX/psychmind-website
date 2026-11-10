---
title: "How we measure PsychMind without tracking you"
excerpt: "We need to know how PsychMind is used. We don't need to know who you are. How we built our stats on daily totals, no cookies, and a code that's deleted every day."
category: "Design and Dev"
source: "team"
author: "John Doe"
date: "November 2026"
readTime: "3 min read"
cover: "analytics"
featured: false
---

## The usual way

Most websites learn about their visitors the same way. A few lines of code from an ad network or an analytics company load on every page. They set cookies, follow each visitor from page to page and from site to site, and some even record the screen as you scroll.

On a shoe shop, that's uncomfortable. On a site where people look for help with anxiety, trauma or grief, it's something we weren't willing to do. What someone searches for here can say a lot about them.

But we still need to know whether PsychMind is working. Providers want to know whether people find their profile. We want to know which searches come up empty. So we set ourselves a challenge: count everything we need, and follow no one.

## What we count

We count a short list of things, and only as daily totals:

- pages viewed
- searches made
- how often a provider's card is actually seen in the results (at least half of it on screen for just over half a second)
- quick looks and full profile views
- profiles saved and session requests sent

That's all. There's no record of who did any of it, only how many times it happened on a given day.

## Telling visitors apart, for one day only

Some numbers need to know whether two visits came from the same person. Three hundred page views mean something different from one visitor than from three hundred.

To count visitors without a cookie, we turn a visitor's IP address and browser into a code, scrambled with a secret that changes every day. The same visitor makes the same code all day, so we count them once. Tomorrow the secret changes, and the same person makes a completely different code, so one day can never be linked to the next.

When the day is over, the codes become a single number and are deleted.

If your browser sends a Do Not Track or Global Privacy Control signal, we don't count you at all.

## Search terms, rebuilt from the filters

Providers find it useful to know what people were looking for when they found them. But what someone types into a search box is exactly the kind of thing that shouldn't be kept.

So we never store what you type. When a provider sees "Anxiety · Online · Florida" on their dashboard, that line was rebuilt on our side from the filters that were used, not copied from anyone's search. And a term only appears once at least five searches have used it, so one unusual search can't be traced back to a person.

## What it costs us

This approach has real trade-offs, and we chose them knowingly.

We can't follow a single journey from the home page to a session request, so there are no funnels and no conversion paths. We can't retarget anyone with ads, and we wouldn't want to. Some questions we'd like answered simply can't be, because the data that would answer them doesn't exist.

We think that's the right price. On our home page, we promise that stats are daily totals with no cookies, and that the code that tells visitors apart is deleted every day. This post is the longer version of that promise.

> Counted, never followed.
>
> The PsychMind team
