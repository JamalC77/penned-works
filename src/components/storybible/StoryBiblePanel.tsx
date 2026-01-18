"use client";

import { useState, useEffect } from "react";

type TabType = "characters" | "locations" | "items" | "timeline" | "plotThreads" | "worldRules" | "flags";

interface Character {
  id: string;
  name: string;
  aliases?: string;
  physicalDescription?: string;
  age?: string;
  personality?: string;
  backstory?: string;
  notes?: string;
  firstAppearance?: string;
  isMainCharacter?: boolean;
}

interface Location {
  id: string;
  name: string;
  description?: string;
  sensoryDetails?: string;
  significance?: string;
  firstAppearance?: string;
  notes?: string;
}

interface StoryItem {
  id: string;
  name: string;
  description?: string;
  significance?: string;
  currentPossessor?: string;
  firstAppearance?: string;
  notes?: string;
}

interface TimelineEvent {
  id: string;
  title: string;
  description?: string;
  storyDate?: string;
  duration?: string;
  notes?: string;
}

interface PlotThread {
  id: string;
  title: string;
  description?: string;
  status: string;
  introducedIn?: string;
  resolvedIn?: string;
  notes?: string;
}

interface WorldRule {
  id: string;
  category: string;
  name: string;
  description?: string;
  limitations?: string;
  notes?: string;
}

interface ConsistencyFlag {
  id: string;
  type: string;
  description: string;
  location1?: string;
  location2?: string;
  status: string;
  resolution?: string;
}

interface StoryBible {
  characters: Character[];
  locations: Location[];
  items: StoryItem[];
  events: TimelineEvent[];
  plotThreads: PlotThread[];
  worldRules: WorldRule[];
  consistencyFlags: ConsistencyFlag[];
}

interface StoryBiblePanelProps {
  projectId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function StoryBiblePanel({ projectId, isOpen, onClose }: StoryBiblePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>("characters");
  const [bible, setBible] = useState<StoryBible | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [selectedItem, setSelectedItem] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && projectId) {
      loadStoryBible();
    }
  }, [isOpen, projectId]);

  const loadStoryBible = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/storybible/${projectId}`);
      if (res.ok) {
        const data = await res.json();
        setBible(data);
      }
    } catch (error) {
      console.error("Failed to load story bible:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await fetch(`/api/storybible/${projectId}/extract`, {
        method: "POST",
      });
      if (res.ok) {
        const data = await res.json();
        console.log("Extraction results:", data);
        await loadStoryBible();
      }
    } catch (error) {
      console.error("Failed to extract story bible:", error);
    } finally {
      setIsExtracting(false);
    }
  };

  if (!isOpen) return null;

  const tabs: { id: TabType; label: string; count: number }[] = [
    { id: "characters", label: "Characters", count: bible?.characters.length || 0 },
    { id: "locations", label: "Locations", count: bible?.locations.length || 0 },
    { id: "items", label: "Items", count: bible?.items.length || 0 },
    { id: "timeline", label: "Timeline", count: bible?.events.length || 0 },
    { id: "plotThreads", label: "Plot Threads", count: bible?.plotThreads.length || 0 },
    { id: "worldRules", label: "World", count: bible?.worldRules.length || 0 },
    { id: "flags", label: "Flags", count: bible?.consistencyFlags.filter((f) => f.status === "open").length || 0 },
  ];

  const renderCharacterDetail = (char: Character) => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-zinc-900">{char.name}</h3>
      {char.isMainCharacter && (
        <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-800 text-xs rounded">Main Character</span>
      )}
      {char.aliases && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Also known as:</span>
          <p className="text-sm text-zinc-700">{JSON.parse(char.aliases).join(", ")}</p>
        </div>
      )}
      {char.physicalDescription && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Appearance:</span>
          <p className="text-sm text-zinc-700">{char.physicalDescription}</p>
        </div>
      )}
      {char.age && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Age:</span>
          <p className="text-sm text-zinc-700">{char.age}</p>
        </div>
      )}
      {char.personality && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Personality:</span>
          <p className="text-sm text-zinc-700">{char.personality}</p>
        </div>
      )}
      {char.backstory && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Backstory:</span>
          <p className="text-sm text-zinc-700">{char.backstory}</p>
        </div>
      )}
      {char.firstAppearance && (
        <div>
          <span className="text-xs font-medium text-zinc-500">First appears in:</span>
          <p className="text-sm text-zinc-700">{char.firstAppearance}</p>
        </div>
      )}
      {char.notes && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Notes:</span>
          <p className="text-sm text-zinc-700">{char.notes}</p>
        </div>
      )}
    </div>
  );

  const renderLocationDetail = (loc: Location) => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-zinc-900">{loc.name}</h3>
      {loc.description && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Description:</span>
          <p className="text-sm text-zinc-700">{loc.description}</p>
        </div>
      )}
      {loc.sensoryDetails && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Sensory Details:</span>
          <p className="text-sm text-zinc-700">{loc.sensoryDetails}</p>
        </div>
      )}
      {loc.significance && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Significance:</span>
          <p className="text-sm text-zinc-700">{loc.significance}</p>
        </div>
      )}
      {loc.firstAppearance && (
        <div>
          <span className="text-xs font-medium text-zinc-500">First appears in:</span>
          <p className="text-sm text-zinc-700">{loc.firstAppearance}</p>
        </div>
      )}
    </div>
  );

  const renderItemDetail = (item: StoryItem) => (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-zinc-900">{item.name}</h3>
      {item.description && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Description:</span>
          <p className="text-sm text-zinc-700">{item.description}</p>
        </div>
      )}
      {item.significance && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Significance:</span>
          <p className="text-sm text-zinc-700">{item.significance}</p>
        </div>
      )}
      {item.currentPossessor && (
        <div>
          <span className="text-xs font-medium text-zinc-500">Current Possessor:</span>
          <p className="text-sm text-zinc-700">{item.currentPossessor}</p>
        </div>
      )}
      {item.firstAppearance && (
        <div>
          <span className="text-xs font-medium text-zinc-500">First appears in:</span>
          <p className="text-sm text-zinc-700">{item.firstAppearance}</p>
        </div>
      )}
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900"></div>
        </div>
      );
    }

    if (!bible) {
      return (
        <div className="text-center py-12 text-zinc-500">
          <p>No story bible data yet.</p>
          <button
            onClick={handleExtract}
            disabled={isExtracting}
            className="mt-4 px-4 py-2 bg-zinc-900 text-white rounded hover:bg-zinc-800 disabled:opacity-50"
          >
            {isExtracting ? "Extracting..." : "Extract from Chapters"}
          </button>
        </div>
      );
    }

    switch (activeTab) {
      case "characters":
        return (
          <div className="flex h-full">
            <div className="w-1/3 border-r border-zinc-200 overflow-y-auto">
              {bible.characters.length === 0 ? (
                <p className="p-4 text-zinc-500 text-sm">No characters found</p>
              ) : (
                bible.characters.map((char) => (
                  <button
                    key={char.id}
                    onClick={() => setSelectedItem(char.id)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 ${
                      selectedItem === char.id ? "bg-zinc-100" : ""
                    }`}
                  >
                    <div className="font-medium text-zinc-900">{char.name}</div>
                    {char.isMainCharacter && (
                      <span className="text-xs text-amber-600">Main Character</span>
                    )}
                  </button>
                ))
              )}
            </div>
            <div className="w-2/3 p-4 overflow-y-auto">
              {selectedItem && bible.characters.find((c) => c.id === selectedItem) ? (
                renderCharacterDetail(bible.characters.find((c) => c.id === selectedItem)!)
              ) : (
                <p className="text-zinc-500 text-sm">Select a character to view details</p>
              )}
            </div>
          </div>
        );

      case "locations":
        return (
          <div className="flex h-full">
            <div className="w-1/3 border-r border-zinc-200 overflow-y-auto">
              {bible.locations.length === 0 ? (
                <p className="p-4 text-zinc-500 text-sm">No locations found</p>
              ) : (
                bible.locations.map((loc) => (
                  <button
                    key={loc.id}
                    onClick={() => setSelectedItem(loc.id)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 ${
                      selectedItem === loc.id ? "bg-zinc-100" : ""
                    }`}
                  >
                    <div className="font-medium text-zinc-900">{loc.name}</div>
                  </button>
                ))
              )}
            </div>
            <div className="w-2/3 p-4 overflow-y-auto">
              {selectedItem && bible.locations.find((l) => l.id === selectedItem) ? (
                renderLocationDetail(bible.locations.find((l) => l.id === selectedItem)!)
              ) : (
                <p className="text-zinc-500 text-sm">Select a location to view details</p>
              )}
            </div>
          </div>
        );

      case "items":
        return (
          <div className="flex h-full">
            <div className="w-1/3 border-r border-zinc-200 overflow-y-auto">
              {bible.items.length === 0 ? (
                <p className="p-4 text-zinc-500 text-sm">No items found</p>
              ) : (
                bible.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSelectedItem(item.id)}
                    className={`w-full text-left px-4 py-3 border-b border-zinc-100 hover:bg-zinc-50 ${
                      selectedItem === item.id ? "bg-zinc-100" : ""
                    }`}
                  >
                    <div className="font-medium text-zinc-900">{item.name}</div>
                  </button>
                ))
              )}
            </div>
            <div className="w-2/3 p-4 overflow-y-auto">
              {selectedItem && bible.items.find((i) => i.id === selectedItem) ? (
                renderItemDetail(bible.items.find((i) => i.id === selectedItem)!)
              ) : (
                <p className="text-zinc-500 text-sm">Select an item to view details</p>
              )}
            </div>
          </div>
        );

      case "timeline":
        return (
          <div className="p-4 overflow-y-auto">
            {bible.events.length === 0 ? (
              <p className="text-zinc-500 text-sm">No timeline events found</p>
            ) : (
              <div className="space-y-4">
                {bible.events.map((event, index) => (
                  <div key={event.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 bg-zinc-900 rounded-full"></div>
                      {index < bible.events.length - 1 && <div className="w-0.5 h-full bg-zinc-300"></div>}
                    </div>
                    <div className="flex-1 pb-4">
                      <h4 className="font-medium text-zinc-900">{event.title}</h4>
                      {event.storyDate && <p className="text-xs text-zinc-500">{event.storyDate}</p>}
                      {event.description && <p className="text-sm text-zinc-700 mt-1">{event.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "plotThreads":
        return (
          <div className="p-4 overflow-y-auto">
            {bible.plotThreads.length === 0 ? (
              <p className="text-zinc-500 text-sm">No plot threads found</p>
            ) : (
              <div className="space-y-4">
                {bible.plotThreads.map((thread) => (
                  <div key={thread.id} className="border border-zinc-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-zinc-900">{thread.title}</h4>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          thread.status === "active"
                            ? "bg-green-100 text-green-800"
                            : thread.status === "resolved"
                            ? "bg-zinc-100 text-zinc-600"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {thread.status}
                      </span>
                    </div>
                    {thread.description && <p className="text-sm text-zinc-700">{thread.description}</p>}
                    {thread.introducedIn && (
                      <p className="text-xs text-zinc-500 mt-2">Introduced in: {thread.introducedIn}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "worldRules":
        return (
          <div className="p-4 overflow-y-auto">
            {bible.worldRules.length === 0 ? (
              <p className="text-zinc-500 text-sm">No world rules found</p>
            ) : (
              <div className="space-y-4">
                {bible.worldRules.map((rule) => (
                  <div key={rule.id} className="border border-zinc-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded">
                        {rule.category}
                      </span>
                      <h4 className="font-medium text-zinc-900">{rule.name}</h4>
                    </div>
                    {rule.description && <p className="text-sm text-zinc-700">{rule.description}</p>}
                    {rule.limitations && (
                      <div className="mt-2">
                        <span className="text-xs font-medium text-zinc-500">Limitations:</span>
                        <p className="text-sm text-zinc-700">{rule.limitations}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );

      case "flags":
        return (
          <div className="p-4 overflow-y-auto">
            {bible.consistencyFlags.length === 0 ? (
              <p className="text-zinc-500 text-sm">No consistency issues found</p>
            ) : (
              <div className="space-y-4">
                {bible.consistencyFlags.map((flag) => (
                  <div
                    key={flag.id}
                    className={`border rounded-lg p-4 ${
                      flag.status === "open" ? "border-red-200 bg-red-50" : "border-zinc-200"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          flag.type === "contradiction"
                            ? "bg-red-100 text-red-800"
                            : flag.type === "unresolved"
                            ? "bg-amber-100 text-amber-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {flag.type}
                      </span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded ${
                          flag.status === "open" ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
                        }`}
                      >
                        {flag.status}
                      </span>
                    </div>
                    <p className="text-sm text-zinc-900">{flag.description}</p>
                    {(flag.location1 || flag.location2) && (
                      <p className="text-xs text-zinc-500 mt-2">
                        {flag.location1}
                        {flag.location2 && ` → ${flag.location2}`}
                      </p>
                    )}
                    {flag.resolution && (
                      <div className="mt-2 p-2 bg-green-50 rounded">
                        <span className="text-xs font-medium text-green-800">Resolution:</span>
                        <p className="text-sm text-green-900">{flag.resolution}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-zinc-900">Story Bible</h2>
            <p className="text-sm text-zinc-500">Your living reference for characters, places, and lore</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleExtract}
              disabled={isExtracting}
              className="px-3 py-1.5 text-sm bg-zinc-100 hover:bg-zinc-200 text-zinc-700 rounded disabled:opacity-50"
            >
              {isExtracting ? "Extracting..." : "Re-extract"}
            </button>
            <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-zinc-200 px-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                setSelectedItem(null);
              }}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? "border-zinc-900 text-zinc-900"
                  : "border-transparent text-zinc-500 hover:text-zinc-700"
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 text-xs bg-zinc-100 rounded">{tab.count}</span>
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">{renderContent()}</div>
      </div>
    </div>
  );
}
