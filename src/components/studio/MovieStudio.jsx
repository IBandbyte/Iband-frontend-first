import StudioLayout from "./StudioLayout";
import StudioHeader from "./StudioHeader";
import AiMentor from "./AiMentor";
import CreateMenu from "./CreateMenu";
import Templates from "./Templates";
import RecentProjects from "./RecentProjects";

export default function MovieStudio() {
  return (
    <StudioLayout>
      <StudioHeader />

      <AiMentor />

      <CreateMenu
        onChange={(item) => {
          console.log("Create:", item);
        }}
      />

      <Templates
        onSelect={(template) => {
          console.log("Template:", template);
        }}
      />

      <RecentProjects
        onOpen={(project) => {
          console.log("Open:", project);
        }}
      />
    </StudioLayout>
  );
}