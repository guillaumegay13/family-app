"use client"; // Make it a client component

import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navigation from '@/components/Navigation';

export default function Home() {
  const familyName = process.env.NEXT_PUBLIC_FAMILY_NAME || 'DefaultFamily';
  const [newMemberName, setNewMemberName] = useState('');
  const [familyMembers, setFamilyMembers] = useState([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);
  const [errorMembers, setErrorMembers] = useState(null);

  const pages = [
    { title: 'Déclaration Les Lauriers - Checklist', href: '/checklist' },
    { title: 'Tâches Quotidiennes', href: '/daily-todo' },
    // Add more pages here as your app grows
  ];

  const fetchFamilyMembers = useCallback(async () => {
    setIsLoadingMembers(true);
    setErrorMembers(null);
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('name')
        .order('name', { ascending: true });
      if (error) throw error;
      setFamilyMembers(data.map(member => member.name) || []);
    } catch (error) {
      console.error("Error fetching family members:", error);
      setErrorMembers("Impossible de récupérer les membres de la famille.");
    }
    setIsLoadingMembers(false);
  }, []);

  useEffect(() => {
    fetchFamilyMembers();
  }, [fetchFamilyMembers]);

  const handleAddMember = async (e) => {
    e.preventDefault();
    const trimmedName = newMemberName.trim();
    if (trimmedName && !familyMembers.includes(trimmedName)) {
      try {
        const { error } = await supabase
          .from('family_members')
          .insert([{ name: trimmedName }]);
        if (error) throw error;
        await fetchFamilyMembers();
        setNewMemberName('');
      } catch (error) {
        console.error("Error adding family member:", error);
        setErrorMembers("Impossible d&apos;ajouter le membre de la famille. Le nom est-il unique?");
      }
    } else if (familyMembers.includes(trimmedName)) {
      setErrorMembers("Ce membre existe déjà.");
    } else {
      setErrorMembers("Le nom du membre ne peut pas être vide.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <main className="max-w-4xl mx-auto px-6 pb-12">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 text-center mb-10">
          Bienvenue sur l&apos;app famille {familyName}
        </h1>

        {pages.length > 0 && (
          <section className="mb-10">
            <h2 className="text-2xl font-medium text-gray-700 mb-6">Applications</h2>
            <ul className="space-y-3">
              {pages.map((page) => (
                <li key={page.href}>
                  <Link
                    href={page.href}
                    className="block w-full p-4 text-center text-lg text-indigo-600 hover:bg-white hover:text-indigo-800 rounded-md border border-gray-200 bg-white transition-colors duration-150"
                  >
                    {page.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white border border-gray-200 rounded-md p-6">
          <h2 className="text-2xl font-medium text-gray-700 mb-6 text-left">Membres de la Famille</h2>
          <form onSubmit={handleAddMember} className="flex flex-col sm:flex-row gap-4 mb-6">
            <input
              type="text"
              value={newMemberName}
              onChange={(e) => { setNewMemberName(e.target.value); setErrorMembers(null); }}
              placeholder="Nom du membre"
              className="flex-grow py-3 px-4 border border-gray-200 rounded-md text-gray-900 placeholder:text-gray-600 text-base"
            />
            <button
              type="submit"
              className="sm:mt-0 py-3 px-8 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-base font-medium"
              disabled={isLoadingMembers}
            >
              {isLoadingMembers && familyMembers.length === 0 ? 'Chargement...' : 'Ajouter'}
            </button>
          </form>
          {errorMembers && <p className="text-red-500 text-base mb-4 text-left">{errorMembers}</p>}
          {isLoadingMembers && familyMembers.length === 0 ? (
            <p className="text-base text-gray-500 text-left">Chargement des membres...</p>
          ) : !isLoadingMembers && familyMembers.length === 0 && !errorMembers ? (
            <p className="text-base text-gray-500 text-left">Aucun membre de famille ajouté pour l&apos;instant.</p>
          ) : (
            <ul className="space-y-3 text-left">
              {familyMembers.map(member => (
                <li key={member} className="text-gray-800 p-4 bg-gray-50 rounded-md text-base">
                  {member}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
