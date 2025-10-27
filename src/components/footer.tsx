export function Footer() {
  return (
    <footer className="bg-card border-t">
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-8 md:grid-cols-3">
          {/* Tournament Info */}
          <div>
            <h3 className="text-primary mb-2 font-semibold">
              Bonnie & Clyde Draft 2s
            </h3>
            <p className="text-muted-foreground text-sm">
              A reverse coed volleyball tournament
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-primary mb-2 font-semibold">Contact</h3>
            <p className="text-muted-foreground text-sm">
              Questions? Reach out to the tournament organizers
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-primary mb-2 font-semibold">Quick Links</h3>
            <ul className="text-muted-foreground space-y-1 text-sm">
              <li>
                <a
                  href="/standings"
                  className="hover:text-primary transition-colors"
                >
                  Standings
                </a>
              </li>
              <li>
                <a
                  href="/schedule"
                  className="hover:text-primary transition-colors"
                >
                  Schedule
                </a>
              </li>
              <li>
                <a
                  href="/teams"
                  className="hover:text-primary transition-colors"
                >
                  Teams
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="text-muted-foreground mt-8 border-t pt-8 text-center text-sm">
          <p>
            &copy; {new Date().getFullYear()} Bonnie & Clyde Draft 2s. All
            rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
