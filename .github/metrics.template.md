### 👋 Hi, I'm {{ LOGIN }}

---

<img align="right" width="150" src="https://count.getloli.com/get/@:GregoireF" alt=":GregoireF">

Hi, my name is Grégoire FAVREAU. I'm a 25 years old developer and computer enthusiast doing things that come to my mind. Most of my work is open-source and available here.

- :telescope: I’m currently working
- ❤️ I like to learn by myself
- :rocket: Co-creator of [WebReadyProjects](https://github.com/WebReadyProjects)
- :speech_balloon: Ask me about anything [here](https://github.com/GregoireF/GregoireF/issues)

[![ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/gregoirefavreau)

<%- await embed(`base`, { base: "header, activity, community, repositories, metadata" }) %>

<details>
    <summary><b>📰 Recent activity</b></summary>
    <%- await embed(`followup`, { followup: true }) %>
</details>

<details>
    <summary><b>🗓️ My Calendar</b></summary>
    <%- await embed(`isocalendar`, { isocalendar: true, isocalendar_duration: "half-year" }) %>
</details>

<details>
    <summary><b>🔥 My Streak</b></summary>
    <img src="https://github-readme-streak-stats.herokuapp.com/?user=gregoiref&theme=dark" alt="streak" />
</details>

<details>
    <summary><b>🟣 Issues & PRs Analysis</b></summary>
    <%- await embed(`followup`, { followup: true }) %>
</details>

<details>
    <summary><b>🟣 Used Languages</b></summary>
    <img src="https://github-readme-stats.vercel.app/api/wakatime?username=gfavreau&border_radius=30&hide_border=true&bg_color=313849&title_color=667EBD&text_color=B1BACD" alt="wakatime" />
</details>

<details>
    <summary><b>🏅 Achievements</b></summary>
    <%- await embed(`achievements`, { achievements: true, achievements_display: "compact" }) %>
    <details>
        <summary><b>Detailed</b></summary>
        <%- await embed(`achievements_detailed`, { achievements: true, achievements_display: "detailed" }) %>
    </details>
</details>
