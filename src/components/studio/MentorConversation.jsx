import React from "react";

const FONT_STACK =
  '"TikTok Sans", Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif';

export default function MentorConversation({
  creator,
  message,
  idea,
  projectStatus,
}) {
  const getConversation = () => {
    if (!creator) {
      return {
        title: "Let's begin.",
        body:
          "Choose what you'd like to create today. Once you've chosen a creative path, I'll guide you step by step.",
      };
    }

    if (projectStatus === "generating") {
      return {
        title: "Creating...",
        body:
          "I'm building the first version now. This is only the beginning—we can keep improving it together.",
      };
    }

    if (projectStatus === "generated") {
      return {
        title: "Your first version is ready.",
        body:
          "Take a look, make changes, experiment and keep refining it. Great creations evolve one step at a time.",
      };
    }

    if (projectStatus === "saved") {
      return {
        title: "Safely saved.",
        body:
          "Your project is waiting whenever you're ready to continue.",
      };
    }

    if (projectStatus === "published") {
      return {
        title: "Congratulations.",
        body:
          "You've turned an idea into something real. That's something to be proud of.",
      };
    }

    return {
      title: creator.label,
      body: message,
    };
  };

  const conversation = getConversation();

  return (
    <section
      style={{
        marginTop: 18,
        padding: 20,
        borderRadius: 20,
        background: "#ffffff",
        border: "1px solid rgba(17,24,39,0.08)",
        fontFamily: FONT_STACK,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "#7b8190",
          marginBottom: 10,
        }}
      >
        Conversation
      </div>

      <h3
        style={{
          margin: "0 0 10px",
          fontSize: 24,
          color: "#16181d",
          lineHeight: 1.2,
        }}
      >
        {conversation.title}
      </h3>

      <p
        style={{
          margin: 0,
          color: "#5f6673",
          lineHeight: 1.7,
          fontSize: 16,
        }}
      >
        {conversation.body}
      </p>

      {idea.trim() && (
        <div
          style={{
            marginTop: 18,
            padding: 14,
            borderRadius: 14,
            background: "#f5f7fb",
            border: "1px solid rgba(17,24,39,0.05)",
          }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: "#7b8190",
              marginBottom: 6,
            }}
          >
            YOUR IDEA
          </div>

          <div
            style={{
              color: "#16181d",
              lineHeight: 1.6,
            }}
          >
            {idea}
          </div>
        </div>
      )}
    </section>
  );
}