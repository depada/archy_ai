import { Box, Moon, Sun } from "lucide-react";
import Button from "./ui/Button";
import { useOutletContext } from "react-router";

const Navbar = () => {
  const { isSignedIn, userName, signIn, signOut, theme, toggleTheme, notify } =
    useOutletContext<AuthContext>();

  const handleAuthClick = async () => {
    if (isSignedIn) {
      try {
        const signedOut = await signOut();

        if (!signedOut) {
          notify("Sign out failed. Please try again.", "error");
          return;
        }

        notify("Signed out.", "success", 2000);
      } catch (e) {
        console.error(`Puter sign out failed: ${e}`);
        notify("Sign out failed. Please try again.", "error");
      }

      return;
    }

    try {
      const signedIn = await signIn();

      if (!signedIn) {
        notify("Sign in failed. Please try again.", "error");
        return;
      }

      notify("Signed in successfully.", "success", 2200);
    } catch (e) {
      console.error(`Puter sign in failed: ${e}`);
      notify("Sign in failed. Please try again.", "error");
    }
  };

  return (
    <header className="navbar">
      <nav className="inner">
        <div className="left">
          <div className="brand">
            <Box className="logo" />

            <span className="name">Archy AI</span>
          </div>

          <ul className="links">
            <a href="#">Product</a>
            <a href="#">Pricing</a>
            <a href="#">Community</a>
            <a href="#">Enterprise</a>
          </ul>
        </div>

        <div className="actions">
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

          {isSignedIn ? (
            <>
              <span className="greeting">
                {userName ? `Hi, ${userName}` : "Signed in"}
              </span>

              <Button size="sm" onClick={handleAuthClick} className="btn">
                Log Out
              </Button>
            </>
          ) : (
            <>
              <Button onClick={handleAuthClick} size="sm" variant="ghost">
                Log In
              </Button>

              <a href="#upload" className="cta">
                Get Started
              </a>
            </>
          )}
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
