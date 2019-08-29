import { Types, CodegenPlugin } from '@graphql-codegen/plugin-helpers';
import { BaseVisitor } from '@graphql-codegen/visitor-plugin-common';
import * as addPlugin from '@graphql-codegen/add';
import { FragmentDefinitionNode } from 'graphql';
import { isUsingTypes } from './utils';

export type NearOperationFileConfig = {
  /**
   * @name baseTypesPath
   * @type string
   * @description Required, should point to the base schema types file.
   * The key of the output is used a the base path for this file.
   *
   * @example
   * ```yml
   * generates:
   * path/to/file.ts:
   *  preset: import-types
   *  presetConfig:
   *    typesPath: types.ts
   *  plugins:
   *    - typescript-operations
   * ```
   */
  typesPath: string;
  /**
   * @name importTypesNamespace
   * @type string
   * @description Optional, override the name of the import namespace used to import from the `baseTypesPath` file.
   * @default Types
   *
   * @example
   * ```yml
   * generates:
   * src/:
   *  preset: near-operation-file
   *  presetConfig:
   *    typesPath: types.ts
   *    importTypesNamespace: SchemaTypes
   *  plugins:
   *    - typescript-operations
   * ```
   */
  importTypesNamespace?: string;
};

export type FragmentNameToFile = { [fragmentName: string]: { filePath: string; importName: string; onType: string; node: FragmentDefinitionNode } };

export const preset: Types.OutputPreset<NearOperationFileConfig> = {
  buildGeneratesSection: options => {
    const baseVisitor = new BaseVisitor(options.config, {});

    if (!options.presetConfig.typesPath) {
      throw new Error(`Preset "near-operation-file" requires you to specify "typesPath" configuration and point it to your base types file (generated by "typescript" plugin)!`);
    }

    const importTypesNamespace = options.presetConfig.importTypesNamespace || 'Types';
    const pluginMap: { [name: string]: CodegenPlugin } = {
      ...options.pluginMap,
      add: addPlugin,
    };
    const plugins = [...options.plugins];
    const config = {
      ...options.config,
      namespacedImportName: importTypesNamespace,
      externalFragments: [],
    };
    options.documents.map(documentFile => {
      if (isUsingTypes(documentFile.content)) {
        plugins.unshift({ add: `import * as ${importTypesNamespace} from '${options.presetConfig.typesPath}';\n` });
      }
    });
    return [
      {
        filename: options.baseOutputDir,
        plugins,
        pluginMap,
        config,
        schema: options.schema,
        schemaAst: options.schemaAst,
        documents: options.documents,
      },
    ] as Types.GenerateOptions[] | null;
  },
};

export default preset;