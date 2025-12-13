import { Card, CardContent } from "@/components/ui/card";
import { GridPattern } from "@/components/ui/grid-pattern";

interface TournamentRulesSectionProps {
  rulesDescription?: string | null;
}

export function TournamentRulesSection({
  rulesDescription,
}: TournamentRulesSectionProps) {
  // Parse rules description to extract sections or handle plain text
  const parseRulesDescription = () => {
    if (!rulesDescription) return null;

    // Check if content has markdown headers
    const hasHeaders = /^\*\*.+\*\*$/m.test(rulesDescription);

    if (!hasHeaders) {
      // Plain text - return as-is
      return {
        isPlainText: true,
        content: rulesDescription,
        sections: [],
      };
    }

    // Parse markdown-style headers and content
    const sections: { title: string; content: string }[] = [];
    const lines = rulesDescription.split('\n');
    let currentSection: { title: string; content: string } | null = null;

    lines.forEach((line) => {
      // Check for section headers (starts with **)
      const headerMatch = line.match(/^\*\*(.+?)\*\*$/);
      if (headerMatch) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = { title: headerMatch[1], content: '' };
      } else if (currentSection && line.trim()) {
        currentSection.content += (currentSection.content ? '\n' : '') + line;
      }
    });

    if (currentSection) {
      sections.push(currentSection);
    }

    return {
      isPlainText: false,
      content: '',
      sections,
    };
  };

  const parsedRules = parseRulesDescription();

  return (
    <section className="relative overflow-hidden py-16 md:py-24">
      {/* Grid pattern background */}
      <GridPattern
        width={80}
        height={80}
        x={-1}
        y={-1}
        className="stroke-primary/10 fill-primary/5"
      />

      {/* Gradient fade overlay */}
      <div className="from-background to-background/80 pointer-events-none absolute inset-0 bg-gradient-to-t via-transparent" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="mx-auto">
          <h2 className="from-primary via-accent to-primary mb-12 bg-gradient-to-r bg-clip-text text-5xl font-bold text-transparent md:text-8xl">
            Tournament Rules
          </h2>
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-7">
            <Card className="col-span-full md:col-span-3">
              <CardContent className="space-y-4 pt-6">
                {parsedRules?.isPlainText ? (
                  // Plain text format - display as-is
                  <div className="prose prose-sm max-w-none">
                    <p className="text-muted-foreground whitespace-pre-wrap text-base leading-relaxed">
                      {parsedRules.content}
                    </p>
                  </div>
                ) : parsedRules && parsedRules.sections.length > 0 ? (
                  // Structured format with markdown headers
                  parsedRules.sections.map((section, i) => (
                    <div key={i}>
                      <h4 className="text-primary mb-2 font-semibold">
                        {section.title}
                      </h4>
                      <div className="text-muted-foreground prose prose-sm max-w-none">
                        {section.content.split('\n').map((line, j) => {
                          // Check for bullet points
                          if (line.trim().startsWith('-')) {
                            return (
                              <li key={j} className="ml-4">
                                {line.trim().substring(1).trim()}
                              </li>
                            );
                          }
                          return line.trim() ? <p key={j}>{line}</p> : <br key={j} />;
                        })}
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback content when no description provided
                  <>
                    <div>
                      <h4 className="text-primary mb-2 font-semibold">
                        Net Height
                      </h4>
                      <p className="text-muted-foreground">
                        Women&apos;s regulation height (7&apos;4⅛&quot;) - lower
                        net, higher fun!
                      </p>
                    </div>
                    <div>
                      <h4 className="text-primary mb-2 font-semibold">
                        Male Player Restrictions
                      </h4>
                      <ul className="text-muted-foreground list-inside list-disc space-y-1">
                        <li>Cannot attack from front row above net height</li>
                        <li>Cannot block at the net</li>
                        <li>Can attack from behind the 10-foot line</li>
                        <li>Can jump serve</li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-primary mb-2 font-semibold">Scoring</h4>
                      <p className="text-muted-foreground">
                        Rally scoring to 21 points.
                      </p>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
            <div className="col-span-full flex flex-col justify-center text-right md:col-span-4">
              <h2 className="text-4xl font-bold">Reverse Coed Rules</h2>
              <h3 className="text-muted-foreground text-xl">
                No rotation required. Only rotate servers (everyone must serve).
                Can rotate if preferred, but reverse coed rules apply.
              </h3>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
