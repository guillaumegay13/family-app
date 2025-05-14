"use client";

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Navigation from '@/components/Navigation';

// Placeholder for family members REMOVED - will fetch from DB
// const FAMILY_MEMBERS = ["Alice", "Bob", "Charlie", "Admin"];

export default function DailyTodoPage() {
    // State for TODOs fetched from Supabase
    const [todos, setTodos] = useState([]);
    const [isLoadingTodos, setIsLoadingTodos] = useState(true);
    const [errorTodos, setErrorTodos] = useState(null);

    // State for the new task form
    const [newTask, setNewTask] = useState('');
    const [assignedTo, setAssignedTo] = useState('');
    const [dueDate, setDueDate] = useState('');

    // State for family members dropdown
    const [familyMembersList, setFamilyMembersList] = useState([]);
    const [isLoadingFamilyMembers, setIsLoadingFamilyMembers] = useState(true);
    const [errorFamilyMembers, setErrorFamilyMembers] = useState(null);

    // Fetch Family Members for Dropdown
    const fetchFamilyMembersForDropdown = useCallback(async () => {
        setIsLoadingFamilyMembers(true);
        setErrorFamilyMembers(null);
        try {
            const { data, error } = await supabase
                .from('family_members')
                .select('name')
                .order('name', { ascending: true });
            if (error) throw error;
            const memberNames = data.map(member => member.name) || [];
            setFamilyMembersList(memberNames);
            if (memberNames.length > 0) {
                setAssignedTo(memberNames[0]);
            } else {
                setAssignedTo('');
            }
        } catch (error) {
            console.error("Error fetching family members for dropdown:", error);
            setErrorFamilyMembers("Impossible de charger les membres. Ajoutez-en sur la page d'accueil.");
        }
        setIsLoadingFamilyMembers(false);
    }, []);

    // Fetch TODOs from Supabase
    const fetchTodos = useCallback(async () => {
        setIsLoadingTodos(true);
        setErrorTodos(null);
        try {
            const { data, error } = await supabase
                .from('todos')
                .select('id, task_text, assigned_to_member_name, due_date, is_completed')
                .order('created_at', { ascending: false }); // Show newest first
            if (error) throw error;
            setTodos(data || []);
        } catch (error) {
            console.error("Error fetching todos:", error);
            setErrorTodos("Impossible de récupérer les tâches de la base de données.");
        }
        setIsLoadingTodos(false);
    }, []);

    // Initial data fetching
    useEffect(() => {
        fetchFamilyMembersForDropdown();
        fetchTodos();
    }, [fetchFamilyMembersForDropdown, fetchTodos]);

    // Handle Adding a New Task
    const handleAddTask = async (e) => {
        e.preventDefault();
        if (!newTask.trim()) {
            setErrorTodos("La description de la tâche ne peut pas être vide.");
            return;
        }
        if (!assignedTo && familyMembersList.length > 0) {
            setErrorTodos("Veuillez assigner la tâche à un membre de la famille.");
            return;
        }
        setErrorTodos(null);

        try {
            const { error } = await supabase.from('todos').insert([
                {
                    task_text: newTask.trim(),
                    assigned_to_member_name: assignedTo,
                    due_date: dueDate || null,
                    is_completed: false,
                },
            ]);
            if (error) throw error;
            setNewTask('');
            setDueDate('');
            await fetchTodos();
        } catch (error) {
            console.error("Error adding task:", error);
            setErrorTodos(`Échec de l'ajout de la tâche: ${error.message}`);
        }
    };

    // Handle Toggling Task Completion Status
    const toggleTodoCompletion = async (id, currentStatus) => {
        setErrorTodos(null);
        try {
            const { error } = await supabase
                .from('todos')
                .update({ is_completed: !currentStatus })
                .match({ id: id });
            if (error) throw error;
            await fetchTodos();
        } catch (error) {
            console.error("Error updating task status:", error);
            setErrorTodos(`Échec de la mise à jour de la tâche: ${error.message}`);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation />

            <main className="max-w-4xl mx-auto px-6 pb-12">
                <h1 className="text-3xl font-bold text-gray-800 text-center mb-8">
                    Tâches Quotidiennes
                </h1>

                <section className="mb-8 bg-white border border-gray-200 rounded-md p-6">
                    <form onSubmit={handleAddTask} className="space-y-5">
                        <input
                            type="text"
                            value={newTask}
                            onChange={(e) => setNewTask(e.target.value)}
                            placeholder="Qu'est-ce qui doit être fait ?"
                            className="w-full px-4 py-3 border border-gray-200 rounded-md text-gray-900 placeholder:text-gray-600 text-base"
                            required
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                {isLoadingFamilyMembers ? (
                                    <p className="text-gray-500 py-2">Chargement des membres...</p>
                                ) : errorFamilyMembers ? (
                                    <p className="text-red-500 py-2">{errorFamilyMembers}</p>
                                ) : familyMembersList.length === 0 ? (
                                    <p className="text-gray-500 py-2">Aucun membre disponible.</p>
                                ) : (
                                    <select
                                        value={assignedTo}
                                        onChange={(e) => setAssignedTo(e.target.value)}
                                        className="w-full px-3 py-3 border border-gray-200 rounded-md text-gray-900 text-base bg-white appearance-none"
                                        style={{
                                            backgroundImage: `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 16' fill='%236B7280'><path fill-rule='evenodd' d='M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z' clip-rule='evenodd' /></svg>")`,
                                            backgroundPosition: `right 0.75rem center`,
                                            backgroundRepeat: `no-repeat`,
                                            backgroundSize: `1.25rem 1.25rem`,
                                            paddingRight: `2.5rem`
                                        }}
                                        aria-label="Assigné à"
                                    >
                                        {familyMembersList.map(member => (
                                            <option key={member} value={member}>
                                                {member}
                                            </option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div>
                                <input
                                    type="date"
                                    value={dueDate}
                                    onChange={(e) => setDueDate(e.target.value)}
                                    className="w-full px-3 py-3 border border-gray-200 rounded-md text-gray-900 text-base"
                                    aria-label="Date d'échéance (optionnel)"
                                />
                            </div>
                        </div>
                        {errorTodos && <p className="text-sm text-red-500 text-center">{errorTodos}</p>}
                        <button
                            type="submit"
                            className="w-full py-3 px-4 rounded-md text-white bg-indigo-600 hover:bg-indigo-700 transition-colors text-base font-medium"
                            disabled={isLoadingFamilyMembers || isLoadingTodos}
                        >
                            {isLoadingTodos ? 'Traitement...' : 'Ajouter la tâche'}
                        </button>
                    </form>
                </section>

                <section>
                    {isLoadingTodos ? (
                        <p className="text-center text-base text-gray-500 py-4 bg-white rounded-md border border-gray-200">Chargement des tâches...</p>
                    ) : todos.length === 0 && !errorTodos ? (
                        <p className="text-center text-base text-gray-500 py-4 bg-white rounded-md border border-gray-200">Aucune tâche pour l'instant</p>
                    ) : (
                        <ul className="space-y-3">
                            {todos.map(todo => (
                                <li
                                    key={todo.id}
                                    className={`p-4 rounded-md border ${todo.is_completed ? 'border-green-100 bg-green-50' : 'border-gray-200 bg-white'} flex items-center justify-between`}
                                >
                                    <div className="flex-grow pr-3">
                                        <span
                                            className={`block text-base ${todo.is_completed ? 'line-through text-gray-500' : 'text-gray-800'}`}
                                        >
                                            {todo.task_text}
                                        </span>
                                        <div className="text-sm text-gray-500 mt-1 flex flex-wrap gap-x-3">
                                            <span>{todo.assigned_to_member_name}</span>
                                            {todo.due_date && (
                                                <span>Échéance: {new Date(todo.due_date + 'T00:00:00').toLocaleDateString()}</span>
                                            )}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => toggleTodoCompletion(todo.id, todo.is_completed)}
                                        className={`ml-3 px-4 py-2 rounded-md text-sm font-medium transition-colors
                                            ${todo.is_completed
                                                ? 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                                                : 'bg-green-100 hover:bg-green-200 text-green-800'}`}
                                    >
                                        {todo.is_completed ? 'Annuler' : 'Fait'}
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
            </main>
        </div>
    );
} 