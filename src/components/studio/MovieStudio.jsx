import { useState } from "react";

import StudioLayout from "./StudioLayout";
import StudioHeader from "./StudioHeader";
import AiMentor from "./AiMentor";
import CreateMenu from "./CreateMenu";
import Templates from "./Templates";
import RecentProjects from "./RecentProjects";

export default function MovieStudio() {
  const [selectedCreator, setSelectedCreator] = useState(null);

  function handleCreate(type) {
    console.log("Create:", type);
    setSelectedCreator(type);
  }

  function handleTemplate(template) {
    console.log("Template:", template);
  }

  function handleProject(project) {
    console.log("Open:", project);
  }

  return (
    <StudioLayout>
      <StudioHeader />

      <AiMentor />

      <CreateMenu onChange={handleCreate} />

      {selectedCreator && (
        <div
          style={{
            padding: 16,
            borderRadius: 16,
            background: "rgba(124,58,237,0.12)",
            border: "1px solid rgba(124,58,237,0.35)",
            color: "#ffffff",
            fontSize: 16,
            fontWeight: 600
          }}
        >
          Creating:
          <span
            style={{
              marginLeft: 8,
              color: "#b794ff"
            }}
          >
            {selectedCreator}
          </span>
        </div>
      )}

      <Templates onSelect={handleTemplate} />

      <RecentProjects onOpen={handleProject} />
    </StudioLayout>
  );
}