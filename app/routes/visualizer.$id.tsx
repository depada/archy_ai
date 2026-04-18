import { useNavigate, useOutletContext, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { generate3DView } from "../../lib/ai.action";
import { Box, Download, Moon, RefreshCcw, Share2, Sun, X } from "lucide-react";
import Button from "../../components/ui/Button";
import { createProject, getProjectById } from "../../lib/puter.action";
import {
  ReactCompareSlider,
  ReactCompareSliderImage,
} from "react-compare-slider";

const VisualizerId = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { userId, theme, toggleTheme, notify } =
    useOutletContext<AuthContext>();

  const hasInitialGenerated = useRef(false);

  const [project, setProject] = useState<DesignItem | null>(null);
  const [isProjectLoading, setIsProjectLoading] = useState(true);

  const [isProcessing, setIsProcessing] = useState(false);
  const [currentImage, setCurrentImage] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleBack = () => navigate("/");
  const handleExport = () => {
    if (!currentImage) {
      notify("No rendered image available to export yet.", "error");
      setStatusMessage("No rendered image available to export yet.");
      return;
    }

    setStatusMessage(null);

    const link = document.createElement("a");
    link.href = currentImage;
    link.download = `archy-ai-${id || "design"}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const runGeneration = async (item: DesignItem) => {
    if (!id || !item.sourceImage) {
      notify("Missing project context for rendering.", "error");
      return;
    }

    try {
      setIsProcessing(true);
      const result = await generate3DView({ sourceImage: item.sourceImage });

      if (result.renderedImage) {
        setCurrentImage(result.renderedImage);

        const updatedItem = {
          ...item,
          renderedImage: result.renderedImage,
          renderedPath: result.renderedPath,
          timestamp: Date.now(),
          ownerId: item.ownerId ?? userId ?? null,
          isPublic: item.isPublic ?? false,
        };

        const saved = await createProject({
          item: updatedItem,
          visibility: "private",
        });

        if (saved) {
          setProject(saved);
          setCurrentImage(saved.renderedImage || result.renderedImage);
          setStatusMessage(null);
          notify("3D render completed.", "success", 2200);
        } else {
          notify(
            "Render generated, but saving failed. You can still export the preview.",
            "error",
          );
          setStatusMessage(
            "Render generated, but saving the project failed. You can still export this preview.",
          );
        }
      } else {
        notify("Render did not return an image. Please retry.", "error");
        setStatusMessage(
          "Render did not return an image. Please retry in a moment.",
        );
      }
    } catch (error) {
      console.error("Generation failed: ", error);
      notify(
        "Failed to generate the 3D visualization. Please try again.",
        "error",
      );
      setStatusMessage(
        "Failed to generate the 3D visualization. Please try again.",
      );
    } finally {
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadProject = async () => {
      if (!id) {
        setIsProjectLoading(false);
        return;
      }

      setIsProjectLoading(true);

      const fetchedProject = await getProjectById({ id });

      if (!isMounted) return;

      setProject(fetchedProject);
      setCurrentImage(fetchedProject?.renderedImage || null);
      if (!fetchedProject) {
        notify(
          "Could not load this project. It may not exist or access may be restricted.",
          "error",
        );
        setStatusMessage(
          "Could not load this project. It may not exist or you may not have access.",
        );
      } else {
        setStatusMessage(null);
      }
      setIsProjectLoading(false);
      hasInitialGenerated.current = false;
    };

    loadProject();

    return () => {
      isMounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (
      isProjectLoading ||
      hasInitialGenerated.current ||
      !project?.sourceImage
    )
      return;

    if (project.renderedImage) {
      setCurrentImage(project.renderedImage);
      hasInitialGenerated.current = true;
      return;
    }

    hasInitialGenerated.current = true;
    void runGeneration(project);
  }, [project, isProjectLoading]);

  return (
    <div className="visualizer">
      <nav className="topbar">
        <div className="brand">
          <Box className="logo" />

          <span className="name">Archy AI</span>
        </div>

        <div className="topbar-actions">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleTheme}
            className="theme-toggle"
            aria-label="Toggle theme"
            title={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleBack}
            className="exit"
          >
            <X className="icon" /> Exit Editor
          </Button>
        </div>
      </nav>

      <section className="content">
        {statusMessage && (
          <div className="rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {statusMessage}
          </div>
        )}

        <div className="panel">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Project</p>
              <h2>{project?.name || `Residence ${id}`}</h2>
              <p className="note">Created by You</p>
            </div>

            <div className="panel-actions">
              <Button
                size="sm"
                onClick={handleExport}
                className="export"
                disabled={!currentImage}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  notify("Sharing will be available soon.", "info", 2200);
                  setStatusMessage("Sharing will be available soon.");
                }}
                className="share"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>

          <div className={`render-area ${isProcessing ? "is-processing" : ""}`}>
            {currentImage ? (
              <img src={currentImage} alt="AI Render" className="render-img" />
            ) : (
              <div className="render-placeholder">
                {project?.sourceImage && (
                  <img
                    src={project?.sourceImage}
                    alt="Original"
                    className="render-fallback"
                  />
                )}

                {!project?.sourceImage && !isProjectLoading && (
                  <p className="text-sm text-zinc-500">
                    No source image available.
                  </p>
                )}

                {isProjectLoading && (
                  <p className="text-sm text-zinc-500">Loading project...</p>
                )}
              </div>
            )}

            {isProcessing && (
              <div className="render-overlay">
                <div className="rendering-card">
                  <RefreshCcw className="spinner" />
                  <span className="title">Rendering...</span>
                  <span className="subtitle">
                    Generating your 3D visualization
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="panel compare">
          <div className="panel-header">
            <div className="panel-meta">
              <p>Comparison</p>
              <h3>Before and After</h3>
            </div>
            <div className="hint">Drag to compare</div>
          </div>

          <div className="compare-stage">
            {project?.sourceImage && currentImage ? (
              <ReactCompareSlider
                defaultValue={50}
                style={{ width: "100%", height: "auto" }}
                itemOne={
                  <ReactCompareSliderImage
                    src={project?.sourceImage}
                    alt="before"
                    className="compare-img"
                  />
                }
                itemTwo={
                  <ReactCompareSliderImage
                    src={currentImage ?? project?.renderedImage ?? ""}
                    alt="after"
                    className="compare-img"
                  />
                }
              />
            ) : (
              <div className="compare-fallback">
                {project?.sourceImage && (
                  <img
                    src={project.sourceImage}
                    alt="Before"
                    className="compare-img"
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};
export default VisualizerId;
