import { SquarePen } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import EditPromptDialog from '@/components/ChatDemo/utils/editPromptDialog';
import Layout from '@/components/Layout';
import { useUserContext } from '@/context/UserContext';

type Prompt = {
  name: string;
  template: string;
  input_types: Record<string, any>;
};

interface AppData {
  config: Record<string, any>;
  prompts: Record<string, Prompt>;
}

const renderNestedConfig = (config: Record<string, any>, depth = 0) => {
  return Object.entries(config).map(([key, value]) => {
    if (typeof value === 'object' && value !== null) {
      return (
        <React.Fragment key={key}>
          <tr className="border-t border-gray-600">
            <td
              className={`px-4 py-2 text-white ${depth === 0 ? 'font-bold' : ''}`}
              style={{ paddingLeft: `${(depth + 1) * 20}px` }}
            >
              {key}
            </td>
          </tr>
          {renderNestedConfig(value, depth + 1)}
        </React.Fragment>
      );
    } else {
      return (
        <tr key={key} className="border-t border-gray-600">
          <td
            className={`px-4 py-2 text-white ${depth === 0 ? 'font-bold' : ''}`}
            style={{ paddingLeft: `${(depth + 1) * 20}px` }}
          >
            {key}
          </td>
          <td className="px-4 py-2 text-white">
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(value, null, 2)}
            </pre>
          </td>
        </tr>
      );
    }
  });
};

const Index: React.FC = () => {
  const [appData, setAppData] = useState<AppData | null>(null);
  const [activeTab, setActiveTab] = useState('config');
  const [selectedPromptName, setSelectedPromptName] = useState<string>('');
  const [selectedPromptTemplate, setSelectedPromptTemplate] =
    useState<string>('');
  const [isEditPromptDialogOpen, setIsEditPromptDialogOpen] = useState(false);
  const { pipeline, getClient } = useUserContext();

  const fetchAppData = useCallback(async () => {
    try {
      const client = await getClient();
      if (!client) {
        throw new Error('Failed to get authenticated client');
      }

      const response = await client.appSettings();
      if (response && response.results) {
        const { config, prompts } = response.results;
        setAppData({
          config: typeof config === 'string' ? JSON.parse(config) : config,
          prompts: prompts || {},
        });
      } else {
        throw new Error('Unexpected response structure');
      }
    } catch (err) {
      console.error('Error fetching app data:', err);
    }
  }, [getClient]);

  useEffect(() => {
    if (pipeline?.deploymentUrl) {
      fetchAppData();
    }
  }, [pipeline?.deploymentUrl, fetchAppData]);

  const { config = {}, prompts = {} } = appData || {};

  const handleEditPrompt = (name: string, template: string) => {
    setSelectedPromptName(name);
    setSelectedPromptTemplate(template);
    setIsEditPromptDialogOpen(true);
  };

  const handleSaveSuccess = () => {
    if (pipeline?.deploymentUrl) {
      fetchAppData();
    }
  };

  return (
    <Layout pageTitle="Settings">
      <main className="w-full flex flex-col min-h-screen container bg-zinc-900 text-white p-4 mt-4">
        <div className="mx-auto max-w-6xl mb-12 mt-4">
          <div className="mt-8">
            <div className="flex justify-between items-center">
              <h3 className="text-2xl font-bold text-blue-500 pl-4">
                App Data
              </h3>
              <div className="flex justify-center mt-4">
                <button
                  className={`px-4 py-2 mx-2 rounded ${
                    activeTab === 'config'
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                  onClick={() => setActiveTab('config')}
                >
                  Config
                </button>
                <button
                  className={`px-4 py-2 mx-2 rounded ${
                    activeTab === 'prompts'
                      ? 'bg-blue-500 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                  onClick={() => setActiveTab('prompts')}
                >
                  Prompts
                </button>
              </div>
            </div>
            <div className="flex flex-col space-y-4 p-4">
              {activeTab === 'config' && (
                <div className="bg-zinc-800 p-4 rounded ">
                  <h4 className="text-xl font-bold text-white pb-2">Config</h4>
                  <table className="w-full bg-zinc-800 border border-gray-600">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="w-1/3 px-4 py-2 text-left text-white">
                          Key
                        </th>
                        <th className="w-2/3 px-4 py-2 text-left text-white">
                          Value
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {config && Object.keys(config).length > 0 ? (
                        renderNestedConfig(config)
                      ) : (
                        <tr>
                          <td
                            colSpan={2}
                            className="px-4 py-2 text-white text-center"
                            style={{ width: '750px' }}
                          >
                            No valid configuration data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
              {activeTab === 'prompts' && (
                <div className="bg-zinc-800 p-4 rounded">
                  <h4 className="text-xl font-bold text-white pb-2">Prompts</h4>
                  <table className="w-full bg-zinc-800 border border-gray-600">
                    <thead>
                      <tr className="border-b border-gray-600">
                        <th className="px-4 py-2 text-left text-white">Name</th>
                        <th className="px-4 py-2 text-left text-white">
                          Template
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(prompts).length > 0 ? (
                        Object.entries(prompts).map(([name, prompt]) => (
                          <tr key={name} className="border-t border-gray-600">
                            <td className="px-4 py-2 text-white">{name}</td>
                            <td className="px-4 py-2 text-white relative">
                              <div className="whitespace-pre-wrap font-sans pr-8">
                                {prompt.template}
                              </div>
                              <button
                                onClick={() =>
                                  handleEditPrompt(name, prompt.template)
                                }
                                className="absolute bottom-2 right-2 text-gray-400 cursor-pointer hover:text-blue-500"
                              >
                                <SquarePen className="h-5 w-5" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={3} className="px-4 py-2 text-white">
                            No prompts available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <EditPromptDialog
        open={isEditPromptDialogOpen}
        onClose={() => setIsEditPromptDialogOpen(false)}
        promptName={selectedPromptName}
        promptTemplate={selectedPromptTemplate}
        onSaveSuccess={handleSaveSuccess}
      />
    </Layout>
  );
};

export default Index;