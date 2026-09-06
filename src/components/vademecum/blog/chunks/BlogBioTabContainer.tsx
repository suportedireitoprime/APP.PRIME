import React from 'react';
import BiografiaCategoriasView from '@/components/vademecum/biografias/BiografiaCategoriasView';
import BiografiaListView from '@/components/vademecum/biografias/BiografiaListView';
import BiografiaArtigoView from '@/components/vademecum/biografias/BiografiaArtigoView';

interface BlogBioTabContainerProps {
  selectedBioPerson: string | null;
  setSelectedBioPerson: (id: string | null) => void;
  selectedBioCategory: string | null;
  setSelectedBioCategory: (cat: string | null) => void;
}

export const BlogBioTabContainer: React.FC<BlogBioTabContainerProps> = ({
  selectedBioPerson,
  setSelectedBioPerson,
  selectedBioCategory,
  setSelectedBioCategory,
}) => {
  if (selectedBioPerson) {
    return (
      <BiografiaArtigoView
        personagemId={selectedBioPerson}
        onBack={() => {
          window.scrollTo({ top: 0 });
          setSelectedBioPerson(null);
        }}
      />
    );
  }

  if (selectedBioCategory) {
    return (
      <BiografiaListView
        categoriaId={selectedBioCategory}
        categoriaLabel={selectedBioCategory.charAt(0).toUpperCase() + selectedBioCategory.slice(1)}
        onBack={() => {
          window.scrollTo({ top: 0 });
          setSelectedBioCategory(null);
        }}
        onSelectPersonagem={(id) => {
          window.scrollTo({ top: 0 });
          setSelectedBioPerson(id);
        }}
      />
    );
  }

  return (
    <BiografiaCategoriasView
      onSelectCategoria={(id) => {
        window.scrollTo({ top: 0 });
        setSelectedBioCategory(id);
      }}
    />
  );
};
